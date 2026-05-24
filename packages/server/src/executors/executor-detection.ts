// External
import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';

// Executors
import type { DetectionResult, ExecutorConfig } from './executor.types.js';

// Lib
import { logger } from '../lib/logger.js';

const exec = promisify(execCb);

const FILE_PATH = 'executors/executor-detection.ts';

export async function execWithTimeout(
  command: string,
  options: { timeout?: number; input?: string } = {},
): Promise<{ stdout: string; stderr: string }> {
  const { timeout = 5000, input } = options;

  if (input) {
    const { spawn } = await import('node:child_process');
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

      child.stdout.on('data', (d) => {
        stdout += d;
      });
      child.stderr.on('data', (d) => {
        stderr += d;
      });
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

export async function detectExecutor(executor: ExecutorConfig): Promise<DetectionResult> {
  let binaryPath: string | undefined;
  try {
    const { stdout } = await execWithTimeout(`command -v ${executor.command}`, { timeout: 3000 });
    binaryPath = stdout.trim();
  } catch {
    return { installed: false, authenticated: false };
  }

  const [versionResult, authResult] = await Promise.all([
    (async () => {
      try {
        const { stdout } = await execWithTimeout(`${executor.command} ${executor.versionFlag}`, { timeout: 5000 });
        const raw = stdout.trim();
        const semverMatch = raw.match(/(\d+\.\d+[\w.-]*)/);
        return semverMatch ? semverMatch[1] : raw.split('\n')[0].slice(0, 50);
      } catch {
        return undefined;
      }
    })(),
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
    await execWithTimeout(`${executor.command} ${authCheck.args.join(' ')}`, {
      timeout: authCheck.timeoutMs ?? 10000,
      input: authCheck.stdin,
    });
    return true;
  } catch (err: unknown) {
    const stderr = (err as { stderr?: string }).stderr ?? '';
    const stdout = (err as { stdout?: string }).stdout ?? '';
    const output = `${stderr} ${stdout}`.toLowerCase();
    if (
      output.includes('invalid api key') ||
      output.includes('please run /login') ||
      output.includes('unauthorized') ||
      output.includes('authentication') ||
      output.includes('not logged in') ||
      output.includes('api key') ||
      output.includes('set an auth method')
    ) {
      logger.warn(`${FILE_PATH} :: ${executor.name} auth check failed — not authenticated`);
      return false;
    }
    logger.warn(`${FILE_PATH} :: ${executor.name} auth check inconclusive: ${stderr.slice(0, 100)}`);
    return true;
  }
}
