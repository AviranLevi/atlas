import { spawn } from 'child_process';
import type { ExecutorConfig } from '../../executors/executor.types.js';
import { generateMcpConfig, removeMcpConfig } from '../../executors/mcp-config-generator.js';
import { logger } from '../logger.js';
import type { CliChatOptions, CliChatResult } from './chat.types.js';

const FILE_PATH = 'lib/chat/cli-chat.ts';
const DEFAULT_TIMEOUT_MS = 120_000;

function buildChatArgs(
  executor: ExecutorConfig,
  prompt: string,
  mcpConfigPath: string | undefined,
  model: string | undefined,
): string[] {
  const args = [...executor.args];

  // Gemini CLI reads MCP config from ~/.gemini/settings.json — no CLI flag needed
  if (mcpConfigPath && executor.mcpConfigFormat !== 'none' && executor.mcpConfigFormat !== 'gemini') {
    args.unshift('--mcp-config', mcpConfigPath);
  }

  if (model && executor.modelFlag) {
    args.push(executor.modelFlag, model);
  }

  switch (executor.promptDelivery) {
    case 'flag':
      args.push(executor.promptFlag!, prompt);
      break;
    case 'positional':
      args.push(prompt);
      break;
    case 'stdin':
      break;
  }

  return args;
}

/**
 * Parses a single stream-json line from a CLI agent (Claude Code or Gemini CLI format).
 * Returns human-readable text + metadata, or null to skip the line.
 */
export function parseCliStreamJsonLine(
  line: string,
): { text: string; isFinal: boolean; skipLog?: boolean } | null {
  if (!line.trim()) return null;
  try {
    const event = JSON.parse(line);

    // ── Claude Code format ──────────────────────────────────────────────────
    if (event.type === 'assistant' && Array.isArray(event.message?.content)) {
      const parts: string[] = [];
      for (const block of event.message.content) {
        if (block.type === 'text' && block.text) {
          parts.push(block.text);
        } else if (block.type === 'tool_use' && block.name) {
          const input = block.input ?? {};
          const hint = input.command ?? input.file_path ?? input.pattern ?? input.query ?? input.url ?? '';
          const summary = hint ? `${hint}`.slice(0, 100) : '';
          parts.push(`▸ ${block.name}${summary ? `  ${summary}` : ''}`);
        }
      }
      return parts.length ? { text: parts.join('\n'), isFinal: false } : null;
    }
    // Claude Code final result — stored in DB, not written to log
    if (event.type === 'result' && typeof event.result === 'string') {
      return { text: event.result, isFinal: true, skipLog: true };
    }

    // ── Gemini CLI format ───────────────────────────────────────────────────
    // Gemini only emits delta:true for all assistant text
    if (event.type === 'message' && event.role === 'assistant' && event.content) {
      return { text: event.content, isFinal: false };
    }
    if (event.type === 'tool_use' && event.tool_name) {
      const params = event.parameters ?? {};
      const hint = params.command ?? params.file_path ?? params.path ?? params.pattern ?? params.query ?? params.url ?? '';
      const summary = hint ? `${hint}`.slice(0, 100) : '';
      return { text: `▸ ${event.tool_name}${summary ? `  ${summary}` : ''}`, isFinal: false };
    }
    // Gemini result event signals completion; final output is accumulated text
    if (event.type === 'result' && event.status !== undefined) {
      return { text: '', isFinal: true, skipLog: true };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Sends a one-shot prompt to a CLI agent, streaming output chunks via `onChunk` as they arrive.
 * Returns the full accumulated response text when the process exits.
 */
export async function streamCliChat(
  options: CliChatOptions,
  onChunk: (text: string) => void,
): Promise<CliChatResult> {
  const { executor, prompt, cwd, model, timeoutMs = DEFAULT_TIMEOUT_MS, signal } = options;

  const configId = `chat-${Date.now()}`;
  let mcpConfigPath: string | undefined;
  if (executor.mcpConfigFormat !== 'none') {
    mcpConfigPath = await generateMcpConfig(configId, executor.mcpConfigFormat);
  }

  const args = buildChatArgs(executor, prompt, mcpConfigPath, model);
  const env = { ...process.env as Record<string, string>, ...executor.env };

  logger.info(`${FILE_PATH} :: streamCliChat - ${executor.command} ${args.join(' ').slice(0, 200)}...`);

  return new Promise<CliChatResult>((resolve, reject) => {
    const proc = spawn(executor.command, args, {
      cwd: cwd || process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
    });

    let streamJsonBuffer = '';
    let fullText = '';
    let finalText = '';
    let stderr = '';

    const handleRaw = (raw: string) => {
      if (executor.outputFormat === 'stream-json') {
        streamJsonBuffer += raw;
        const lines = streamJsonBuffer.split('\n');
        streamJsonBuffer = lines.pop() ?? '';
        for (const line of lines) {
          const parsed = parseCliStreamJsonLine(line);
          if (!parsed) continue;
          if (parsed.isFinal) {
            finalText = parsed.text;
          } else if (parsed.text) {
            const chunk = parsed.text + '\n';
            fullText += chunk;
            onChunk(chunk);
          }
        }
      } else {
        fullText += raw;
        onChunk(raw);
      }
    };

    proc.stdout?.on('data', (data: Buffer) => handleRaw(data.toString()));
    proc.stderr?.on('data', (data: Buffer) => { stderr += data.toString(); });

    if (executor.promptDelivery === 'stdin') {
      proc.stdin?.write(prompt);
      proc.stdin?.end();
    }

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      cleanup();
      reject(new Error(`CLI chat timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const onAbort = () => {
      proc.kill('SIGTERM');
      cleanup();
      reject(new Error('CLI chat aborted'));
    };

    if (signal) {
      if (signal.aborted) {
        proc.kill('SIGTERM');
        cleanup();
        reject(new Error('CLI chat aborted'));
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }

    function cleanup(): void {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      if (mcpConfigPath) {
        removeMcpConfig(configId, executor.mcpConfigFormat);
      }
    }

    proc.on('close', (code) => {
      cleanup();
      const text = (finalText || fullText).trim();
      if (code !== 0 && !text) {
        const errorMsg = stderr.trim() || `CLI exited with code ${code}`;
        logger.error(`${FILE_PATH} :: streamCliChat`, errorMsg);
        reject(new Error(errorMsg));
        return;
      }
      resolve({ text, exitCode: code });
    });

    proc.on('error', (err) => {
      cleanup();
      logger.error(`${FILE_PATH} :: streamCliChat spawn error`, err);
      reject(err);
    });
  });
}

/**
 * Sends a one-shot prompt to a CLI agent and returns the full response.
 * No streaming — the entire output is collected and returned at once.
 */
export function runCliChat(options: CliChatOptions): Promise<CliChatResult> {
  return streamCliChat(options, () => {});
}

/**
 * Formats conversation history + new message into a single prompt string
 * suitable for one-shot CLI execution.
 */
export function formatCliPrompt(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  newMessage: string,
): string {
  const parts: string[] = [];

  parts.push(`<system>\n${systemPrompt}\n</system>`);

  if (history.length > 0) {
    parts.push('<conversation_history>');
    for (const msg of history) {
      if (msg.role === 'tool') continue;
      const tag = msg.role === 'user' ? 'user' : 'assistant';
      parts.push(`<${tag}>\n${msg.content}\n</${tag}>`);
    }
    parts.push('</conversation_history>');
  }

  parts.push(`<user>\n${newMessage}\n</user>`);
  parts.push('Respond to the user\'s latest message. Be concise and direct.');

  return parts.join('\n\n');
}
