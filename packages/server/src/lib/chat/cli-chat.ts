// External
import { spawn } from 'node:child_process';

// Shared
import { stripCliPromptEcho, stripCliPromptEchoStreaming } from '@atlas/shared';

// Executors
import type { ExecutorConfig } from '../../executors/executor.types.js';
import { generateMcpConfig, removeMcpConfig } from '../../executors/mcp-config-generator.js';

// Lib
import type { CliChatOptions, CliChatResult } from './chat.types.js';
import { logger } from '../logger.js';

const FILE_PATH = 'lib/chat/cli-chat.ts';
const DEFAULT_TIMEOUT_MS = 300_000; // 5 minutes — complex tasks (scanning, multi-step agents) need time

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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
export function parseCliStreamJsonLine(line: string): { text: string; isFinal: boolean; skipLog?: boolean } | null {
  if (!line.trim()) return null;
  try {
    const event: unknown = JSON.parse(line);
    if (!isRecord(event)) return null;

    // ── Claude Code format ──────────────────────────────────────────────────
    const message = isRecord(event.message) ? event.message : undefined;
    if (event.type === 'assistant' && message && Array.isArray(message.content)) {
      const parts: string[] = [];
      for (const block of message.content) {
        if (!isRecord(block)) continue;
        if (block.type === 'text' && typeof block.text === 'string') {
          parts.push(block.text);
        } else if (block.type === 'tool_use' && typeof block.name === 'string') {
          const input = isRecord(block.input) ? block.input : {};
          let hint = '';
          // TodoWrite/TodoRead: extract count from todos array
          if (Array.isArray(input.todos)) {
            hint = `${input.todos.length} todo${input.todos.length !== 1 ? 's' : ''}`;
          } else {
            // Standard hint fields → path/description fallbacks → first string value (covers MCP tools)
            const firstStringVal = Object.values(input).find(
              (v): v is string => typeof v === 'string' && v.length > 0 && v.length < 200,
            );
            hint = String(
              input.command ??
                input.file_path ??
                input.path ??
                input.pattern ??
                input.query ??
                input.url ??
                input.description ??
                firstStringVal ??
                '',
            ).slice(0, 100);
          }
          parts.push(`▸ ${block.name}${hint ? `  ${hint}` : ''}`);
        }
      }
      return parts.length ? { text: parts.join('\n'), isFinal: false } : null;
    }
    // Claude Code final result — stored in DB, not written to log
    if (event.type === 'result' && typeof event.result === 'string') {
      return { text: event.result, isFinal: true, skipLog: true };
    }

    // ── Gemini CLI format ───────────────────────────────────────────────────
    // Gemini emits: role 'model' (Google convention) or 'assistant'
    const isAssistantMsg =
      event.type === 'message' &&
      (event.role === 'assistant' || event.role === 'model') &&
      typeof event.content === 'string';
    if (isAssistantMsg) {
      return { text: event.content as string, isFinal: false };
    }
    if (event.type === 'tool_use' && typeof event.tool_name === 'string') {
      const params = isRecord(event.parameters) ? event.parameters : {};
      const hint =
        params.command ?? params.file_path ?? params.path ?? params.pattern ?? params.query ?? params.url ?? '';
      const summary = hint ? `${hint}`.slice(0, 100) : '';
      return { text: `▸ ${event.tool_name}${summary ? `  ${summary}` : ''}`, isFinal: false };
    }
    // tool_result events contain output from tool execution
    if (event.type === 'tool_result' && event.content) {
      const preview =
        typeof event.content === 'string' ? event.content.slice(0, 200) : JSON.stringify(event.content).slice(0, 200);
      return preview.trim() ? { text: preview, isFinal: false } : null;
    }
    // Gemini result event signals completion; final output is accumulated text
    if (event.type === 'result' && event.status !== undefined) {
      return { text: '', isFinal: true, skipLog: true };
    }

    // Catch-all: log any text-bearing event we don't recognize
    if (typeof event.content === 'string' && event.content.trim()) {
      logger.debug?.(`cli-chat :: unhandled event type="${event.type}" role="${event.role}"`);
      return { text: event.content, isFinal: false };
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
export async function streamCliChat(options: CliChatOptions, onChunk: (text: string) => void): Promise<CliChatResult> {
  const { executor, prompt, cwd, model, timeoutMs = DEFAULT_TIMEOUT_MS, signal } = options;

  const configId = `chat-${Date.now()}`;
  let mcpConfigPath: string | undefined;
  if (executor.mcpConfigFormat !== 'none') {
    mcpConfigPath = await generateMcpConfig(configId, executor.mcpConfigFormat);
  }

  const args = buildChatArgs(executor, prompt, mcpConfigPath, model);
  const env = { ...(process.env as Record<string, string>), ...executor.env };

  logger.info(`${FILE_PATH} :: streamCliChat - ${executor.command} ${args.join(' ').slice(0, 200)}...`);
  const startMs = Date.now();

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
    // Tracks how many characters of the echo-stripped buffer have already been emitted,
    // so we only send new delta bytes to the client on each chunk.
    let emittedCleanLength = 0;

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
            const chunk = `${parsed.text}\n`;
            fullText += chunk;
            onChunk(chunk);
          }
        }
      } else {
        // Accumulate and apply echo-stripping before emitting to the client.
        // This prevents prompt-echo artifacts from appearing during streaming.
        fullText += raw;
        const clean = stripCliPromptEchoStreaming(fullText);
        if (clean.length > emittedCleanLength) {
          onChunk(clean.slice(emittedCleanLength));
          emittedCleanLength = clean.length;
        }
      }
    };

    proc.stdout?.on('data', (data: Buffer) => handleRaw(data.toString()));
    proc.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

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
      const elapsedMs = Date.now() - startMs;
      const text = stripCliPromptEcho((finalText || fullText).trim());
      if (code !== 0 && !text) {
        const errorMsg = stderr.trim() || `CLI exited with code ${code}`;
        logger.error(`${FILE_PATH} :: streamCliChat - failed after ${elapsedMs}ms (exit ${code})`, errorMsg);
        reject(new Error(errorMsg));
        return;
      }
      logger.info(`${FILE_PATH} :: streamCliChat - done in ${elapsedMs}ms, ${text.length} chars (exit ${code})`);
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
  parts.push(
    "Respond to the user's latest message. Be concise and direct. " +
      'Do not repeat, quote, or output the <system> block or <conversation_history> — only your answer to the user.',
  );

  return parts.join('\n\n');
}
