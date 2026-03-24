import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import type { ExecutorConfig, ExecutorStatus } from './executor.types.js';
import { logger } from '../lib/logger.js';

const exec = promisify(execCb);

const FILE_PATH = 'executors/executor-registry.ts';

const KNOWN_EXECUTORS: ExecutorConfig[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    command: 'claude',
    args: ['--print', '--output-format', 'text', '--dangerously-skip-permissions'],
    promptDelivery: 'stdin',
    mcpConfigFormat: 'claude',
    versionFlag: '--version',
    authCheck: { args: ['--print', '--output-format', 'text'], stdin: 'say ok', timeoutMs: 15000 },
    authHint: 'Run: claude /login',
    setup: { install: 'npm install -g @anthropic-ai/claude-code', auth: 'claude /login' },
    description: 'Anthropic Claude Code CLI agent with full MCP support',
    docsUrl: 'https://docs.anthropic.com/en/docs/claude-code',
    modelFlag: '--model',
    defaultModel: 'sonnet',
    modelPresets: [
      { value: 'opus', label: 'Claude Opus 4.6' },
      { value: 'sonnet', label: 'Claude Sonnet 4.6' },
      { value: 'haiku', label: 'Claude Haiku 4.5' },
    ],
  },
  {
    id: 'aider',
    name: 'Aider',
    command: 'aider',
    args: ['--yes-always', '--no-git'],
    promptDelivery: 'flag',
    promptFlag: '--message',
    mcpConfigFormat: 'none',
    versionFlag: '--version',
    setup: { install: 'pip install aider-chat', auth: 'export OPENAI_API_KEY=sk-...' },
    description: 'AI pair programming in your terminal',
    docsUrl: 'https://aider.chat',
    modelFlag: '--model',
    modelPresets: [
      { value: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'anthropic' },
      { value: 'anthropic/claude-opus-4-6', label: 'Claude Opus 4.6', provider: 'anthropic' },
      { value: 'gpt-4.1', label: 'GPT-4.1', provider: 'openai' },
      { value: 'o3', label: 'o3', provider: 'openai' },
      { value: 'ollama_chat/llama3', label: 'Llama 3 (Ollama)', provider: 'ollama' },
      { value: 'ollama_chat/codellama', label: 'Code Llama (Ollama)', provider: 'ollama' },
      { value: 'ollama_chat/deepseek-coder-v2', label: 'DeepSeek Coder V2 (Ollama)', provider: 'ollama' },
    ],
    providerMapping: [
      { providerType: 'anthropic', envVars: { ANTHROPIC_API_KEY: 'apiKey' } },
      { providerType: 'openai', envVars: { OPENAI_API_KEY: 'apiKey' } },
      { providerType: 'openai-compatible', envVars: { OPENAI_API_KEY: 'apiKey', OPENAI_API_BASE: 'baseUrl' } },
      { providerType: 'ollama', envVars: { OLLAMA_API_BASE: 'baseUrl' } },
    ],
  },
  {
    id: 'codex',
    name: 'OpenAI Codex CLI',
    command: 'codex',
    args: ['--quiet'],
    promptDelivery: 'positional',
    mcpConfigFormat: 'none',
    versionFlag: '--version',
    setup: { install: 'npm install -g @openai/codex', auth: 'export OPENAI_API_KEY=sk-...' },
    description: 'OpenAI Codex CLI for code generation',
    docsUrl: 'https://github.com/openai/codex',
    modelFlag: '--model',
    modelPresets: [
      { value: 'gpt-5.2-codex', label: 'GPT-5.2 Codex', provider: 'openai' },
      { value: 'gpt-5.1-codex-mini', label: 'GPT-5.1 Codex Mini', provider: 'openai' },
      { value: 'o3', label: 'o3', provider: 'openai' },
    ],
    providerMapping: [
      { providerType: 'openai', envVars: { OPENAI_API_KEY: 'apiKey' } },
    ],
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    command: 'gemini',
    args: [],
    promptDelivery: 'positional',
    mcpConfigFormat: 'generic-json',
    versionFlag: '--version',
    setup: { install: 'npm install -g @google/gemini-cli', auth: 'gemini auth login' },
    description: 'Google Gemini CLI agent',
    docsUrl: 'https://github.com/google-gemini/gemini-cli',
    modelFlag: '--model',
    modelPresets: [
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (Preview)' },
      { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (Preview)' },
    ],
  },
  {
    id: 'amp',
    name: 'Amp',
    command: 'amp',
    args: [],
    promptDelivery: 'positional',
    mcpConfigFormat: 'none',
    versionFlag: '--version',
    setup: { install: 'npm install -g @sourcegraph/amp' },
    description: 'Sourcegraph Amp coding agent',
    docsUrl: 'https://ampcode.com',
    modelFlag: '--model',
    modelPresets: [
      { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    ],
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    command: 'opencode',
    args: [],
    promptDelivery: 'positional',
    mcpConfigFormat: 'none',
    versionFlag: '--version',
    setup: { install: 'go install github.com/opencode-ai/opencode@latest' },
    description: 'Open source AI coding agent',
    docsUrl: 'https://github.com/opencode-ai/opencode',
    modelFlag: '--model',
    modelPresets: [
      { value: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'anthropic' },
      { value: 'openai/gpt-4.1', label: 'GPT-4.1', provider: 'openai' },
    ],
    providerMapping: [
      { providerType: 'anthropic', envVars: { ANTHROPIC_API_KEY: 'apiKey' } },
      { providerType: 'openai', envVars: { OPENAI_API_KEY: 'apiKey' } },
    ],
  },
  {
    id: 'goose',
    name: 'Goose',
    command: 'goose',
    args: ['run', '--no-session', '-q'],
    promptDelivery: 'flag',
    promptFlag: '-t',
    mcpConfigFormat: 'none',
    versionFlag: '--version',
    setup: {
      install: 'curl -fsSL https://github.com/block/goose/releases/download/stable/download_cli.sh | bash',
      auth: 'goose configure',
    },
    description: 'Open source AI agent by Block with multi-provider and local model support',
    docsUrl: 'https://github.com/block/goose',
    modelFlag: '--model',
    modelPresets: [
      { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'anthropic' },
      { value: 'claude-opus-4-6', label: 'Claude Opus 4.6', provider: 'anthropic' },
      { value: 'gpt-4.1', label: 'GPT-4.1', provider: 'openai' },
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { value: 'llama3', label: 'Llama 3 (Ollama)', provider: 'ollama' },
      { value: 'deepseek-coder-v2', label: 'DeepSeek Coder V2 (Ollama)', provider: 'ollama' },
    ],
    providerMapping: [
      { providerType: 'anthropic', envVars: { ANTHROPIC_API_KEY: 'apiKey' } },
      { providerType: 'openai', envVars: { OPENAI_API_KEY: 'apiKey' } },
      { providerType: 'openai-compatible', envVars: { OPENAI_API_KEY: 'apiKey', OPENAI_API_BASE: 'baseUrl' } },
      { providerType: 'ollama', envVars: { OLLAMA_HOST: 'baseUrl' } },
    ],
  },
];

interface DetectionResult {
  installed: boolean;
  authenticated: boolean;
  version?: string;
  binaryPath?: string;
}

async function execWithTimeout(
  command: string,
  options: { timeout?: number; input?: string } = {},
): Promise<{ stdout: string; stderr: string }> {
  const { timeout = 5000, input } = options;

  if (input) {
    // For stdin input, we need to use child_process.spawn
    const { spawn } = await import('child_process');
    return new Promise((resolve, reject) => {
      const child = spawn('bash', ['-c', command], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error('timeout'));
      }, timeout);

      child.stdout.on('data', (d) => { stdout += d; });
      child.stderr.on('data', (d) => { stderr += d; });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) resolve({ stdout, stderr });
        else reject(Object.assign(new Error(`exit ${code}`), { stdout, stderr }));
      });
      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      child.stdin.write(input);
      child.stdin.end();
    });
  }

  return exec(command, { timeout, encoding: 'utf-8' });
}

async function detectExecutor(executor: ExecutorConfig): Promise<DetectionResult> {
  // Check if command exists
  let binaryPath: string | undefined;
  try {
    const { stdout } = await execWithTimeout(`command -v ${executor.command}`, { timeout: 3000 });
    binaryPath = stdout.trim();
  } catch {
    return { installed: false, authenticated: false };
  }

  // Get version and check auth in parallel (both are independent)
  const [versionResult, authResult] = await Promise.all([
    // Version check
    (async () => {
      try {
        const { stdout } = await execWithTimeout(
          `${executor.command} ${executor.versionFlag}`,
          { timeout: 5000 },
        );
        const raw = stdout.trim();
        const semverMatch = raw.match(/(\d+\.\d+[\w.-]*)/);
        return semverMatch ? semverMatch[1] : raw.split('\n')[0].slice(0, 50);
      } catch {
        return undefined;
      }
    })(),
    // Auth check
    (async () => {
      if (!executor.authCheck) return true;
      return checkAuth(executor);
    })(),
  ]);

  return { installed: true, authenticated: authResult, version: versionResult, binaryPath };
}

async function checkAuth(executor: ExecutorConfig): Promise<boolean> {
  const { authCheck } = executor;
  if (!authCheck) return true;

  try {
    await execWithTimeout(
      `${executor.command} ${authCheck.args.join(' ')}`,
      {
        timeout: authCheck.timeoutMs ?? 10000,
        input: authCheck.stdin,
      },
    );
    return true;
  } catch (err: unknown) {
    const stderr = (err as { stderr?: string }).stderr ?? '';
    const stdout = (err as { stdout?: string }).stdout ?? '';
    const output = `${stderr} ${stdout}`.toLowerCase();
    // Common auth failure patterns
    if (
      output.includes('invalid api key') ||
      output.includes('please run /login') ||
      output.includes('unauthorized') ||
      output.includes('authentication') ||
      output.includes('not logged in') ||
      output.includes('api key')
    ) {
      logger.warn(`${FILE_PATH} :: ${executor.name} auth check failed — not authenticated`);
      return false;
    }
    // Other errors (network, timeout) — assume authenticated, don't block
    logger.warn(`${FILE_PATH} :: ${executor.name} auth check inconclusive: ${stderr.slice(0, 100)}`);
    return true;
  }
}

class ExecutorRegistry {
  private cache: Map<string, DetectionResult> | null = null;
  private cacheTime = 0;
  private refreshPromise: Promise<void> | null = null;
  private readonly CACHE_TTL = 120_000; // 2 minutes (was 60s)

  private async refreshCache(): Promise<void> {
    const now = Date.now();
    if (this.cache && now - this.cacheTime < this.CACHE_TTL) return;

    // Deduplicate concurrent refresh calls — if a refresh is already running,
    // wait for it instead of spawning a second round of detections.
    if (this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    this.refreshPromise = this.doRefresh(now);
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefresh(now: number): Promise<void> {
    const newCache = new Map<string, DetectionResult>();

    // Detect ALL executors in parallel (not sequentially)
    const results = await Promise.all(
      KNOWN_EXECUTORS.map(async (executor) => {
        const result = await detectExecutor(executor);
        return { executor, result };
      }),
    );

    for (const { executor, result } of results) {
      newCache.set(executor.id, result);
      if (result.installed) {
        logger.info(
          `${FILE_PATH} :: detected ${executor.name} v${result.version ?? '?'} at ${result.binaryPath}`,
        );
      }
    }

    this.cache = newCache;
    this.cacheTime = now;
  }

  getById(id: string): ExecutorConfig | undefined {
    return KNOWN_EXECUTORS.find((e) => e.id === id);
  }

  async listAll(): Promise<ExecutorStatus[]> {
    await this.refreshCache();
    return KNOWN_EXECUTORS.map((e) => {
      const detection: DetectionResult = this.cache?.get(e.id) ?? { installed: false, authenticated: false };
      return {
        id: e.id,
        name: e.name,
        description: e.description,
        docsUrl: e.docsUrl,
        installed: detection.installed,
        authenticated: detection.authenticated,
        mcpConfigFormat: e.mcpConfigFormat,
        version: detection.version,
        binaryPath: detection.binaryPath,
        authHint: !detection.authenticated ? e.authHint : undefined,
        setup: e.setup,
        modelFlag: e.modelFlag,
        defaultModel: e.defaultModel,
        modelPresets: e.modelPresets,
        providerMapping: e.providerMapping,
        supportsCustomModel: e.supportsCustomModel,
      };
    });
  }

  async listInstalled(): Promise<ExecutorStatus[]> {
    return (await this.listAll()).filter((e) => e.installed);
  }

  /** Force refresh the detection cache */
  async refresh(): Promise<void> {
    this.cache = null;
    await this.refreshCache();
  }
}

export const executorRegistry = new ExecutorRegistry();
