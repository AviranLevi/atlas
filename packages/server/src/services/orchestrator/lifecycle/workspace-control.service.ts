// External
import path from 'node:path';
import fs from 'node:fs';

// Shared
import type { Workspace } from '@atlas/shared';
import { TASK_STATUS } from '@atlas/shared';

// Repositories
import { workspacesRepository } from '../../../db/repositories/index.js';

// Services
import { activityLogService, projectsService, tasksService } from '../../index.js';

// Executors
import { executorRegistry, removeMcpConfig } from '../../../executors/index.js';

// Lib
import { activeProcesses, clearEntryTimers } from '../shared/active-processes.js';
import { AppError } from '../../../lib/errors.js';
import { logger } from '../../../lib/logger.js';
import { WorktreeService } from '../../worktree/index.js';

const FILE_PATH = 'services/orchestrator/workspace-control.service.ts';
const OUTPUT_DIR = path.resolve(process.cwd(), 'data', 'workspace-logs');

export class WorkspaceControlService {
  private worktreeService = new WorktreeService();

  /** Kills the agent process and optionally resets the task status. */
  async stopWork(workspaceId: string, resetTaskStatus = true): Promise<Workspace> {
    const FUNCTION_NAME = 'stopWork';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'running' && workspace.status !== 'pending') {
        throw new AppError('Workspace is not active', { status: 400 });
      }

      const entry = activeProcesses.get(workspaceId);
      if (entry) {
        clearEntryTimers(entry);
        const proc = entry.process;
        if (!proc.killed && proc.pid) {
          try {
            process.kill(-proc.pid, 'SIGTERM');
          } catch {
            proc.kill('SIGTERM');
          }
          setTimeout(() => {
            if (!proc.killed && proc.pid) {
              try {
                process.kill(-proc.pid, 'SIGKILL');
              } catch {
                proc.kill('SIGKILL');
              }
            }
          }, 5000);
        }
      }

      activeProcesses.delete(workspaceId);

      const updated = workspacesRepository.update(workspaceId, {
        status: 'stopped',
        completedAt: new Date().toISOString(),
      });

      // Reset task status only if this workspace is the one currently driving
      // the task. If the user stops an old execute workspace while a new
      // brainstorm result is awaiting approval, we must not clobber that status.
      if (resetTaskStatus) {
        const task = await tasksService.getById(workspace.taskId);
        const taskIsOwnedByThisWorkspace =
          task.status === TASK_STATUS.IN_PROGRESS || task.workflowStage === workspace.workflowStage;
        if (taskIsOwnedByThisWorkspace) {
          await tasksService.update(workspace.taskId, { status: TASK_STATUS.TODO });
        }
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

  /** Stops the process, removes the worktree, and deletes the MCP config. */
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

      removeMcpConfig(workspaceId, executorRegistry.getById(workspace.agentRuntime)?.mcpConfigFormat);

      workspacesRepository.remove(workspaceId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cleanup workspace', { cause: error });
    }
  }

  /** Re-run a failed or completed workspace: clean up old one, start fresh. */
  async rerun(workspaceId: string, agentRuntimeId: string, model?: string): Promise<Workspace> {
    const FUNCTION_NAME = 'rerun';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'failed' && workspace.status !== 'completed' && workspace.status !== 'stopped') {
        throw new AppError('Can only re-run failed, stopped, or completed workspaces', { status: 400 });
      }

      const taskId = workspace.taskId;
      // Use the explicitly provided model, or fall back to the previous run's model
      const resolvedModel = model ?? workspace.model ?? undefined;

      // Clean up the old workspace
      await this.cleanup(workspaceId);

      // Reset task status so startWork can pick it up
      await tasksService.update(taskId, { status: TASK_STATUS.TODO });

      // Lazy import to avoid circular dependency (spawn → advancement → spawn)
      const { workspaceSpawnService } = await import('../spawn/workspace-spawn.service.js');
      return workspaceSpawnService.startWork(taskId, agentRuntimeId, undefined, resolvedModel);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to re-run workspace', { cause: error });
    }
  }
}

export const workspaceControlService = new WorkspaceControlService();
