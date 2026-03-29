import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { ExecutorConfig, ProviderField } from './executor.types.js';
import { generateMcpConfig } from './mcp-config-generator.js';
import { logger } from '../lib/logger.js';
import { parseCliStreamJsonLine } from '../lib/chat/cli-chat.js';

const FILE_PATH = 'executors/spawn-agent.ts';
const OUTPUT_DIR = path.resolve(process.cwd(), 'data', 'workspace-logs');
const MAX_DB_OUTPUT_LINES = 50;


export interface SpawnResult {
  process: ChildProcess;
  logFile: string;
  mcpConfigPath?: string;
}

export interface SpawnCallbacks {
  onCompleted: (output: string) => void;
  onFailed: (output: string, error?: string) => void;
}

export interface SpawnOptions {
  model?: string;
  provider?: { type: string; apiKey: string | null; baseUrl: string | null };
}

function buildArgs(executor: ExecutorConfig, prompt: string, mcpConfigPath?: string, model?: string): string[] {
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

/** Resolves a ProviderField reference to the actual value from the provider object. */
function resolveProviderField(
  field: ProviderField,
  provider: NonNullable<SpawnOptions['provider']>,
): string | null {
  return field === 'apiKey' ? provider.apiKey : provider.baseUrl;
}

export function spawnAgent(
  workspaceId: string,
  executor: ExecutorConfig,
  cwd: string,
  prompt: string,
  callbacks: SpawnCallbacks,
  options: SpawnOptions = {},
): SpawnResult {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const logFile = path.join(OUTPUT_DIR, `${workspaceId}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  const outputLines: string[] = [];

  let mcpConfigPath: string | undefined;
  if (executor.mcpConfigFormat !== 'none') {
    mcpConfigPath = generateMcpConfig(workspaceId, executor.mcpConfigFormat);
  }

  const args = buildArgs(executor, prompt, mcpConfigPath, options.model);

  // Build env: process env → executor static env → provider credential env
  const env: Record<string, string> = { ...process.env as Record<string, string>, ...executor.env };

  if (options.provider && executor.providerMapping) {
    const mapping = executor.providerMapping.find((m) => m.providerType === options.provider!.type);
    if (mapping) {
      for (const [envKey, field] of Object.entries(mapping.envVars)) {
        const value = resolveProviderField(field, options.provider);
        if (value) env[envKey] = value;
      }
    }
  }

  logger.info(`${FILE_PATH} :: spawnAgent - spawning ${executor.command} ${args.join(' ').slice(0, 200)}... in ${cwd}`);

  const proc = spawn(executor.command, args, {
    cwd,
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
  });

  let streamJsonBuffer = '';
  let finalResult = '';

  const collectOutput = (data: Buffer) => {
    const raw = data.toString();

    if (executor.outputFormat === 'stream-json') {
      streamJsonBuffer += raw;
      const lines = streamJsonBuffer.split('\n');
      streamJsonBuffer = lines.pop() ?? ''; // keep incomplete last line

      for (const line of lines) {
        const parsed = parseCliStreamJsonLine(line);
        if (!parsed) continue;
        if (parsed.isFinal) {
          finalResult = parsed.text;
        }
        if (!parsed.skipLog) {
          const entry = parsed.text + '\n';
          logStream.write(entry);
          const entryLines = entry.split('\n');
          outputLines.push(...entryLines);
          while (outputLines.length > MAX_DB_OUTPUT_LINES) outputLines.shift();
        }
      }
    } else {
      logStream.write(raw);
      const lines = raw.split('\n');
      outputLines.push(...lines);
      while (outputLines.length > MAX_DB_OUTPUT_LINES) outputLines.shift();
    }
  };

  proc.stdout?.on('data', collectOutput);
  proc.stderr?.on('data', collectOutput);

  if (executor.promptDelivery === 'stdin') {
    proc.stdin?.write(prompt);
    proc.stdin?.end();
  }

  proc.on('close', (code) => {
    logStream.end();
    const finalOutput = executor.outputFormat === 'stream-json'
      ? (finalResult || outputLines.join('\n'))
      : outputLines.join('\n');
    if (code === 0) {
      callbacks.onCompleted(finalOutput);
    } else {
      callbacks.onFailed(finalOutput, `Exit code: ${code}`);
    }
  });

  proc.on('error', (err) => {
    logStream.end();
    callbacks.onFailed(`Spawn error: ${err.message}`, err.message);
  });

  return { process: proc, logFile, mcpConfigPath };
}
