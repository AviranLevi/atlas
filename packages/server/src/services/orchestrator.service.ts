// NPM
import { type ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
// Services
import { tasksService, projectsService, activityLogService } from './index.js';
import { WorktreeService } from './worktree.service.js';
import { PromptBuilderService } from './prompt-builder.service.js';
// DB
import { workspacesRepository } from '../db/repositories/index.js';
// Executors
import { executorRegistry, removeMcpConfig } from '../executors/index.js';
import { spawnAgent } from '../executors/spawn-agent.js';
// Utils
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';
// Types
import type { Workspace } from '@my-agents/shared';

const FILE_PATH = 'services/orchestrator.service.ts';
const OUTPUT_DIR = path.resolve(process.cwd(), 'data', 'workspace-logs');

const activeProcesses = new Map<string, ChildProcess>();

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

      const executor = executorRegistry.getById(agentRuntimeId);
      if (!executor) {
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
        hasMcpAccess: executor.mcpConfigFormat !== 'none',
      });

      // Use the extracted spawn function
      const cwd = executor.usesProjectRoot ? project.localPath : worktreePath;
      const result = spawnAgent(workspace.id, executor, cwd, prompt, {
        onCompleted: (output) => {
          activeProcesses.delete(workspace.id);
          const ws = workspacesRepository.update(workspace.id, {
            status: 'completed',
            output,
            completedAt: new Date().toISOString(),
          });
          tasksService.update(ws.taskId, { status: 'In Review' }).catch((e) => {
            logger.warn(`${FILE_PATH} :: spawnAgent - failed to move task to In Review`, e);
          });
          activityLogService.log({
            projectId: ws.projectId,
            taskId: ws.taskId,
            workspaceId: workspace.id,
            agentId: ws.agentId,
            eventType: 'agent_completed',
            description: 'Agent completed successfully',
            metadata: {},
          });
          logger.info(`${FILE_PATH} :: spawnAgent - process completed for workspace ${workspace.id}`);
        },
        onFailed: (output, error) => {
          activeProcesses.delete(workspace.id);
          const ws = workspacesRepository.update(workspace.id, {
            status: 'failed',
            output,
            completedAt: new Date().toISOString(),
          });
          tasksService.update(ws.taskId, { status: 'To Do' }).catch((e) => {
            logger.warn(`${FILE_PATH} :: spawnAgent - failed to reset task status`, e);
          });
          activityLogService.log({
            projectId: ws.projectId,
            taskId: ws.taskId,
            workspaceId: workspace.id,
            agentId: ws.agentId,
            eventType: 'agent_failed',
            description: `Agent failed: ${error ?? 'unknown error'}`,
            metadata: { error },
          });
          logger.error(`${FILE_PATH} :: spawnAgent - process failed for workspace ${workspace.id}: ${error}`);
        },
      });

      // Store process reference and mark as running — done after spawnAgent
      // returns so result.process is available.
      activeProcesses.set(workspace.id, result.process);
      workspacesRepository.update(workspace.id, {
        status: 'running',
        pid: result.process.pid ?? null,
        startedAt: new Date().toISOString(),
      });

      await tasksService.update(taskId, { status: 'In Progress' });

      activityLogService.log({
        projectId: project.id,
        taskId,
        workspaceId: workspace.id,
        agentId: task.agentId,
        eventType: 'agent_started',
        description: `Agent started on task: ${task.name}`,
        metadata: { agentRuntime: agentRuntimeId, branchName },
      });

      return workspacesRepository.findByIdOrThrow(workspace.id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to start work', { cause: error });
    }
  }

  async stopWork(workspaceId: string, resetTaskStatus = true): Promise<Workspace> {
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

      const updated = workspacesRepository.update(workspaceId, {
        status: 'stopped',
        completedAt: new Date().toISOString(),
      });

      // Keep the task status in sync: reset to "To Do" so the user
      // doesn't see "In Progress" for a task whose agent was stopped.
      if (resetTaskStatus) {
        await tasksService.update(workspace.taskId, { status: 'To Do' });
      }

      activityLogService.log({
        projectId: workspace.projectId,
        taskId: workspace.taskId,
        workspaceId,
        agentId: workspace.agentId,
        eventType: 'agent_stopped',
        description: 'Agent stopped manually',
        metadata: {},
      });

      return updated;
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

      removeMcpConfig(workspaceId);

      workspacesRepository.remove(workspaceId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cleanup workspace', { cause: error });
    }
  }

  async getDiff(workspaceId: string) {
    const FUNCTION_NAME = 'getDiff';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);
      const project = await projectsService.getById(workspace.projectId);

      if (!project.localPath) {
        throw new AppError('Project has no local path', { status: 400 });
      }

      return this.worktreeService.getDiff(workspace.worktreePath, project.localPath);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get diff', { cause: error });
    }
  }

  async mergeAndClose(workspaceId: string): Promise<Workspace> {
    const FUNCTION_NAME = 'mergeAndClose';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'completed') {
        throw new AppError('Can only merge completed workspaces', { status: 400 });
      }

      const project = await projectsService.getById(workspace.projectId);

      if (!project.localPath) {
        throw new AppError('Project has no local path', { status: 400 });
      }

      // Merge the branch
      this.worktreeService.merge(workspace.worktreePath, project.localPath, workspace.branchName);

      // Move task to Done
      await tasksService.update(workspace.taskId, { status: 'Done' });

      activityLogService.log({
        projectId: workspace.projectId,
        taskId: workspace.taskId,
        workspaceId,
        agentId: workspace.agentId,
        eventType: 'agent_completed',
        description: 'Changes merged and task completed',
        metadata: { branchName: workspace.branchName },
      });

      // Clean up the workspace (worktree, logs, mcp config)
      await this.cleanup(workspaceId);

      // Return the workspace state before deletion
      return { ...workspace, status: 'completed' };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to merge and close', { cause: error });
    }
  }

  addDiffComment(workspaceId: string, comment: { filename: string; lineNumber: number; lineContent: string; body: string }): Workspace {
    const workspace = workspacesRepository.findByIdOrThrow(workspaceId);
    const existing = Array.isArray(workspace.diffComments) ? [...workspace.diffComments] : [];
    const newComment = {
      id: crypto.randomUUID(),
      ...comment,
      createdAt: new Date().toISOString(),
    };
    existing.push(newComment);
    return workspacesRepository.update(workspaceId, {
      diffComments: JSON.stringify(existing),
    } as any);
  }

  editDiffComment(workspaceId: string, commentId: string, body: string): Workspace {
    const workspace = workspacesRepository.findByIdOrThrow(workspaceId);
    const existing = Array.isArray(workspace.diffComments) ? [...workspace.diffComments] : [];
    const idx = existing.findIndex((c: any) => c.id === commentId);
    if (idx === -1) throw new AppError('Comment not found', { status: 404 });
    existing[idx] = { ...existing[idx], body, updatedAt: new Date().toISOString() };
    return workspacesRepository.update(workspaceId, {
      diffComments: JSON.stringify(existing),
    } as any);
  }

  removeDiffComment(workspaceId: string, commentId: string): Workspace {
    const workspace = workspacesRepository.findByIdOrThrow(workspaceId);
    const existing = Array.isArray(workspace.diffComments) ? [...workspace.diffComments] : [];
    const filtered = existing.filter((c: any) => c.id !== commentId);
    return workspacesRepository.update(workspaceId, {
      diffComments: JSON.stringify(filtered),
    } as any);
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
   * Checks PIDs on startup and kills/marks orphaned workspaces as failed.
   * Handles two cases:
   *   1. Process is dead  -> just mark failed in DB (it already exited)
   *   2. Process is alive -> kill it (server restart doesn't mean the agent
   *      should keep running unattended) then mark failed
   */
  reconcileOnStartup(): void {
    const active = [
      ...workspacesRepository.findByStatus('running'),
      ...workspacesRepository.findByStatus('pending'),
    ];

    for (const ws of active) {
      if (ws.pid) {
        let alive = false;
        try {
          process.kill(ws.pid, 0); // signal 0 = probe, throws if dead
          alive = true;
        } catch {
          // process already gone
        }

        if (alive) {
          logger.warn(
            `${FILE_PATH} :: reconcileOnStartup - PID ${ws.pid} still running after restart, killing it (workspace ${ws.id})`,
          );
          try {
            process.kill(ws.pid, 'SIGTERM');
            // Give it 3 s then force-kill
            setTimeout(() => {
              try { process.kill(ws.pid!, 'SIGKILL'); } catch { /* already dead */ }
            }, 3000);
          } catch {
            // already exited between probe and kill -- that's fine
          }
        } else {
          logger.warn(
            `${FILE_PATH} :: reconcileOnStartup - PID ${ws.pid} not found (workspace ${ws.id})`,
          );
        }
      } else {
        logger.warn(
          `${FILE_PATH} :: reconcileOnStartup - workspace ${ws.id} has no PID recorded, marking failed`,
        );
      }

      workspacesRepository.update(ws.id, {
        status: 'failed',
        completedAt: new Date().toISOString(),
      });

      // Reset the associated task so it surfaces back in the kanban
      tasksService.update(ws.taskId, { status: 'To Do' }).catch((e) => {
        logger.warn(`${FILE_PATH} :: reconcileOnStartup - failed to reset task status for workspace ${ws.id}`, e);
      });
    }

    if (active.length > 0) {
      logger.info(
        `${FILE_PATH} :: reconcileOnStartup - reconciled ${active.length} orphaned workspace(s)`,
      );
    }
  }
}
