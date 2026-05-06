// Shared
import type { Workspace } from '@atlas/shared';
import { TASK_STATUS } from '@atlas/shared';

// Repositories
import { workspacesRepository } from '../../../db/repositories/index.js';

// Services
import { activityLogService, projectsService, tasksService } from '../../index.js';
import { createTerminalCallbacks } from '../spawn/index.js';

// Executors
import { executorRegistry } from '../../../executors/index.js';
import { spawnAgent } from '../../../executors/spawn-agent.js';

// Services (worktree)
import { WorktreeService } from '../../worktree/index.js';

// Lib
import { activeProcesses, isShuttingDown } from '../shared/active-processes.js';
import type { ActiveProcessEntry } from '../shared/active-processes.js';
import { AppError } from '../../../lib/errors.js';
import { logger } from '../../../lib/logger.js';
import { buildPrompt, resolveSpawnOptions } from '../spawn/spawn-options.js';
import { attachWatchdog } from './watchdog.js';
import { buildRequestChangesPrompt, type DiffCommentForPrompt } from './prompts.js';

const FILE_PATH = 'services/orchestrator/review/request-changes.service.ts';

export class RequestChangesService {
  private worktreeService = new WorktreeService();

  /** Re-runs the agent on a completed workspace with review comments as context. */
  async requestChanges(workspaceId: string): Promise<Workspace> {
    const FUNCTION_NAME = 'requestChanges';
    try {
      if (isShuttingDown()) {
        throw new AppError('Server is shutting down', { status: 503 });
      }

      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'completed') {
        throw new AppError('Can only request changes on completed workspaces', { status: 400 });
      }

      const comments: DiffCommentForPrompt[] = Array.isArray(workspace.diffComments) ? workspace.diffComments : [];

      if (comments.length === 0) {
        throw new AppError('No review comments to send', { status: 400 });
      }

      const _task = await tasksService.getById(workspace.taskId);
      const project = await projectsService.getById(workspace.projectId);

      if (!project.localPath) {
        throw new AppError('Project has no local path', { status: 400 });
      }

      const executor = executorRegistry.getById(workspace.agentRuntime);
      if (!executor) {
        throw new AppError(`Unknown agent runtime: ${workspace.agentRuntime}`, { status: 400 });
      }

      // Build a review prompt with the original context + comments
      const basePrompt = await buildPrompt({
        taskId: workspace.taskId,
        projectId: project.id,
        agentId: workspace.agentId,
        hasMcpAccess: executor.mcpConfigFormat !== 'none',
      });

      const fullPrompt = buildRequestChangesPrompt(basePrompt, comments);

      // Resolve model/provider from workspace's recorded model + agent's provider
      const { spawnOpts } = await resolveSpawnOptions(executor, workspace.agentId, workspace.model ?? undefined);

      const { onCompleted, onFailed } = createTerminalCallbacks({
        workspace,
        worktreeService: this.worktreeService,
        taskName: workspace.taskName ?? 'task',
        // Roll workspace back to 'completed' on failure (it was already completed
        // before this re-run, so the diff and context remain intact for a retry).
        failedStatus: 'completed',
        failedTaskStatus: TASK_STATUS.IN_REVIEW,
        failedDescriptionPrefix: 'Agent failed during review changes',
        commitStage: 'execute',
        completedTaskStatus: TASK_STATUS.IN_REVIEW,
        completedDescription: 'Agent completed review changes',
        onAfterCompleted: () => {
          // Clear inline diff comments now that the agent has addressed them.
          workspacesRepository.update(workspace.id, { diffComments: JSON.stringify([]) });
        },
      });

      // Re-spawn the agent on the SAME worktree (not a new one)
      const cwd = executor.usesProjectRoot ? project.localPath : workspace.worktreePath;
      const result = await spawnAgent(workspace.id, executor, cwd, fullPrompt, { onCompleted, onFailed }, spawnOpts);

      // Race mitigation: shutdown signal may have arrived between the gate
      // check at the top and now. Kill any child we just spawned to prevent
      // an orphan that the shutdown handler already missed in its snapshot.
      if (isShuttingDown()) {
        const proc = result.process;
        if (proc.pid) {
          try {
            process.kill(-proc.pid, 'SIGKILL');
          } catch {
            try {
              proc.kill('SIGKILL');
            } catch {
              /* already dead */
            }
          }
        }
        throw new AppError('Server is shutting down', { status: 503 });
      }

      const entry: ActiveProcessEntry = {
        process: result.process,
        onFailed,
        startedAt: Date.now(),
        stage: 'review',
      };
      attachWatchdog(entry, workspace.id, workspace.projectId, workspace.taskId, workspace.agentId, onFailed);
      activeProcesses.set(workspace.id, entry);

      // Mark as running (don't clear comments yet — cleared on success only)
      workspacesRepository.update(workspace.id, {
        status: 'running',
        pid: result.process.pid ?? null,
        startedAt: new Date().toISOString(),
        completedAt: null,
      });

      await tasksService.update(workspace.taskId, { status: TASK_STATUS.IN_PROGRESS });

      activityLogService.log({
        projectId: project.id,
        taskId: workspace.taskId,
        workspaceId,
        agentId: workspace.agentId,
        eventType: 'agent_started',
        description: `Review changes requested with ${comments.length} comment(s)`,
        metadata: { commentCount: comments.length },
      });

      return workspacesRepository.findByIdOrThrow(workspace.id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to request changes', { cause: error });
    }
  }
}

export const requestChangesService = new RequestChangesService();
