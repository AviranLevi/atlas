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

  if (mcpConfigPath && executor.mcpConfigFormat !== 'none') {
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
 * Sends a one-shot prompt to a CLI agent and returns the full response.
 * No streaming -- the entire output is collected and returned at once.
 */
export function runCliChat(options: CliChatOptions): Promise<CliChatResult> {
  const { executor, prompt, cwd, model, timeoutMs = DEFAULT_TIMEOUT_MS, signal } = options;

  const configId = `chat-${Date.now()}`;
  let mcpConfigPath: string | undefined;
  if (executor.mcpConfigFormat !== 'none') {
    mcpConfigPath = generateMcpConfig(configId, executor.mcpConfigFormat);
  }

  const args = buildChatArgs(executor, prompt, mcpConfigPath, model);
  const env = { ...process.env as Record<string, string>, ...executor.env };

  logger.info(`${FILE_PATH} :: runCliChat - ${executor.command} ${args.join(' ').slice(0, 200)}...`);

  return new Promise<CliChatResult>((resolve, reject) => {
    const proc = spawn(executor.command, args, {
      cwd: cwd || process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data: Buffer) => { stdout += data.toString(); });
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
        removeMcpConfig(configId);
      }
    }

    proc.on('close', (code) => {
      cleanup();
      const text = stdout.trim();
      if (code !== 0 && !text) {
        const errorMsg = stderr.trim() || `CLI exited with code ${code}`;
        logger.error(`${FILE_PATH} :: runCliChat`, errorMsg);
        reject(new Error(errorMsg));
        return;
      }
      resolve({ text, exitCode: code });
    });

    proc.on('error', (err) => {
      cleanup();
      logger.error(`${FILE_PATH} :: runCliChat spawn error`, err);
      reject(err);
    });
  });
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
