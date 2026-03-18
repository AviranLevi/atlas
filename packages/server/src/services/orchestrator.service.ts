// NPM
import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Services
import { tasksService, projectsService } from './index.js';
import { WorktreeService } from './worktree.service.js';
import { PromptBuilderService } from './prompt-builder.service.js';
// DB
import { workspacesRepository } from '../db/repositories/index.js';
// Config
import { getRuntimeById, type AgentRuntimeConfig } from '../config/agent-runtimes.js';
// Utils
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';
// Types
import type { Workspace } from '@my-agents/shared';

const FILE_PATH = 'services/orchestrator.service.ts';
const OUTPUT_DIR = path.resolve(process.cwd(), 'data', 'workspace-logs');
const MCP_CONFIG_DIR = path.resolve(process.cwd(), 'data', 'mcp-configs');
const MAX_DB_OUTPUT_LINES = 50;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

const activeProcesses = new Map<string, ChildProcess>();

function buildAgentArgs(runtime: AgentRuntimeConfig, prompt: string, mcpConfigPath?: string): string[] {
  const args = [...runtime.args];

  if (mcpConfigPath && runtime.mcpConfigSupported) {
    args.unshift('--mcp-config', mcpConfigPath);
  }

  switch (runtime.promptDelivery) {
    case 'flag':
      args.push(runtime.promptFlag!, prompt);
      break;
    case 'positional':
      args.push(prompt);
      break;
    case 'stdin':
      break;
  }

  return args;
}

function createMcpConfig(workspaceId: string): string {
  fs.mkdirSync(MCP_CONFIG_DIR, { recursive: true });

  const config = {
    mcpServers: {
      'my-agents': {
        command: 'npx',
        args: ['tsx', 'packages/server/src/mcp.ts'],
        cwd: PROJECT_ROOT,
      },
    },
  };

  const configPath = path.join(MCP_CONFIG_DIR, `${workspaceId}.json`);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return configPath;
}

export class OrchestratorService {
  private worktreeService = new WorktreeService();
  private promptBuilder = new PromptBuilderService();

  async startWork(taskId: string, agentRuntimeId: string): Promise<Workspace> {
    const FUNCTION_NAME = 'startWork';
    try {
      const task = await tasksService.getById(taskId);

      if (!task.projectId) {
        throw new AppError('Task must be assigned to a project with a local path', { status: 400 });
      }

      const project = await projectsService.getById(task.projectId);

      if (!project.localPath) {
        throw new AppError(`Project "${project.name}" has no local path configured`, { status: 400 });
      }

      if (!fs.existsSync(project.localPath)) {
        throw new AppError(`Project local path does not exist: ${project.localPath}`, { status: 400 });
      }

      const runtime = getRuntimeById(agentRuntimeId);
      if (!runtime) {
        throw new AppError(`Unknown agent runtime: ${agentRuntimeId}`, { status: 400 });
      }

      const existing = workspacesRepository.findByTaskId(taskId);
      if (existing && (existing.status === 'running' || existing.status === 'pending')) {
        throw new AppError('A workspace is already active for this task', { status: 409 });
      }

      const { worktreePath, branchName } = this.worktreeService.create(
        project.localPath,
        taskId,
        task.name,
      );

      const workspace = workspacesRepository.insert({
        taskId,
        projectId: project.id,
        agentId: task.agentId ?? null,
        agentRuntime: agentRuntimeId,
        branchName,
        worktreePath,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const prompt = await this.promptBuilder.build({
        taskId,
        projectId: project.id,
        agentId: task.agentId,
        hasMcpAccess: runtime.mcpConfigSupported,
      });

      this.spawnAgent(workspace.id, runtime, worktreePath, prompt);

      await tasksService.update(taskId, { status: 'In Progress' });

      return workspacesRepository.findByIdOrThrow(workspace.id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to start work', { cause: error });
    }
  }

  async stopWork(workspaceId: string): Promise<Workspace> {
    const FUNCTION_NAME = 'stopWork';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'running' && workspace.status !== 'pending') {
        throw new AppError('Workspace is not active', { status: 400 });
      }

      const proc = activeProcesses.get(workspaceId);
      if (proc && !proc.killed) {
        proc.kill('SIGTERM');
        setTimeout(() => {
          if (!proc.killed) proc.kill('SIGKILL');
        }, 5000);
      }

      activeProcesses.delete(workspaceId);

      return workspacesRepository.update(workspaceId, {
        status: 'stopped',
        completedAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to stop work', { cause: error });
    }
  }

  async getStatus(workspaceId: string): Promise<Workspace & { fullOutput?: string }> {
    const FUNCTION_NAME = 'getStatus';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      const logFile = path.join(OUTPUT_DIR, `${workspaceId}.log`);
      let fullOutput: string | undefined;
      if (fs.existsSync(logFile)) {
        fullOutput = fs.readFileSync(logFile, 'utf-8');
      }

      return { ...workspace, fullOutput };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get workspace status', { cause: error });
    }
  }

  async cleanup(workspaceId: string): Promise<void> {
    const FUNCTION_NAME = 'cleanup';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status === 'running') {
        await this.stopWork(workspaceId);
      }

      const task = await tasksService.getById(workspace.taskId);
      if (task.projectId) {
        const project = await projectsService.getById(task.projectId);
        if (project.localPath) {
          try {
            this.worktreeService.remove(workspace.worktreePath, project.localPath);
          } catch {
            logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - worktree already removed`);
          }
        }
      }

      const logFile = path.join(OUTPUT_DIR, `${workspaceId}.log`);
      if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
      }

      const mcpConfig = path.join(MCP_CONFIG_DIR, `${workspaceId}.json`);
      if (fs.existsSync(mcpConfig)) {
        fs.unlinkSync(mcpConfig);
      }

      workspacesRepository.remove(workspaceId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cleanup workspace', { cause: error });
    }
  }

  async listActive(): Promise<Workspace[]> {
    return [
      ...workspacesRepository.findByStatus('pending'),
      ...workspacesRepository.findByStatus('running'),
    ];
  }

  async listAll(): Promise<Workspace[]> {
    return workspacesRepository.findAll();
  }

  /**
   * Checks PIDs on startup and marks orphaned workspaces as failed.
   */
  reconcileOnStartup(): void {
    const running = workspacesRepository.findByStatus('running');
    for (const ws of running) {
      if (ws.pid) {
        try {
          process.kill(ws.pid, 0);
        } catch {
          logger.warn(`${FILE_PATH} :: reconcileOnStartup - PID ${ws.pid} not found, marking workspace ${ws.id} as failed`);
          workspacesRepository.update(ws.id, {
            status: 'failed',
            completedAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  private spawnAgent(workspaceId: string, runtime: AgentRuntimeConfig, cwd: string, prompt: string): void {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const logFile = path.join(OUTPUT_DIR, `${workspaceId}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });
    const outputLines: string[] = [];

    let mcpConfigPath: string | undefined;
    if (runtime.mcpConfigSupported) {
      mcpConfigPath = createMcpConfig(workspaceId);
    }

    const args = buildAgentArgs(runtime, prompt, mcpConfigPath);

    logger.info(`${FILE_PATH} :: spawnAgent - spawning ${runtime.command} ${args.join(' ').slice(0, 200)}... in ${cwd}`);

    const proc = spawn(runtime.command, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    activeProcesses.set(workspaceId, proc);

    workspacesRepository.update(workspaceId, {
      status: 'running',
      pid: proc.pid ?? null,
      startedAt: new Date().toISOString(),
    });

    const collectOutput = (data: Buffer) => {
      const text = data.toString();
      logStream.write(text);

      const lines = text.split('\n');
      outputLines.push(...lines);
      while (outputLines.length > MAX_DB_OUTPUT_LINES) {
        outputLines.shift();
      }
    };

    proc.stdout?.on('data', collectOutput);
    proc.stderr?.on('data', collectOutput);

    if (runtime.promptDelivery === 'stdin') {
      proc.stdin?.write(prompt);
      proc.stdin?.end();
    }

    proc.on('close', (code) => {
      logStream.end();
      activeProcesses.delete(workspaceId);

      const finalOutput = outputLines.join('\n');
      const status = code === 0 ? 'completed' : 'failed';

      workspacesRepository.update(workspaceId, {
        status,
        output: finalOutput,
        completedAt: new Date().toISOString(),
      });

      logger.info(`${FILE_PATH} :: spawnAgent - process exited with code ${code} for workspace ${workspaceId}`);
    });

    proc.on('error', (err) => {
      logStream.end();
      activeProcesses.delete(workspaceId);

      workspacesRepository.update(workspaceId, {
        status: 'failed',
        output: `Spawn error: ${err.message}`,
        completedAt: new Date().toISOString(),
      });

      logger.error(`${FILE_PATH} :: spawnAgent - error`, err);
    });
  }
}
