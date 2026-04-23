// Shared
import type { Workspace } from '@atlas/shared';
import { TASK_STATUS } from '@atlas/shared';

// Repositories
import { workspacesRepository } from '../../../db/repositories/index.js';

// Services
import { activityLogService, projectsService, tasksService } from '../../index.js';

// Executors
import { executorRegistry } from '../../../executors/index.js';
import { spawnAgent } from '../../../executors/spawn-agent.js';

// Lib
import { activeProcesses, clearEntryTimers, isShuttingDown } from '../shared/active-processes.js';
import type { ActiveProcessEntry } from '../shared/active-processes.js';
import { AppError } from '../../../lib/errors.js';
import { logger } from '../../../lib/logger.js';
import { buildPrompt, resolveSpawnOptions } from '../spawn/spawn-options.js';
import { attachWatchdog } from './watchdog.js';
import { buildRequestChangesPrompt, type DiffCommentForPrompt } from './prompts.js';

const FILE_PATH = 'services/orchestrator/review/request-changes.service.ts';

export class RequestChangesService {
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

      let requestChangesFired = false;
      const onFailedCallback = (output: string, error?: string) => {
        if (requestChangesFired) return;
        requestChangesFired = true;
        const entry = activeProcesses.get(workspace.id);
        if (entry) clearEntryTimers(entry);
        activeProcesses.delete(workspace.id);
        // Deliberate retry semantics: requestChanges runs on top of an already-
        // completed workspace. If the review agent's re-run fails, we roll the
        // workspace status back to 'completed' (its prior state) and put the
        // task back in In Review so the user can click "Request Changes" again
        // without losing the prior diff. The activity_log below records the
        // real failure so history isn't a lie.
        workspacesRepository.update(workspace.id, {
          status: 'completed',
          output,
          completedAt: new Date().toISOString(),
        });
        tasksService.update(workspace.taskId, { status: TASK_STATUS.IN_REVIEW }).catch((e) => {
          logger.warn(`${FILE_PATH} :: requestChanges - failed to reset task to In Review`, e);
        });
        activityLogService.log({
          projectId: workspace.projectId,
          taskId: workspace.taskId,
          workspaceId,
          agentId: workspace.agentId,
          eventType: 'agent_failed',
          description: `Agent failed during review changes: ${error ?? 'unknown error'}`,
          metadata: { error },
        });
      };

      // Re-spawn the agent on the SAME worktree (not a new one)
      const cwd = executor.usesProjectRoot ? project.localPath : workspace.worktreePath;
      const result = await spawnAgent(
        workspace.id,
        executor,
        cwd,
        fullPrompt,
        {
          onCompleted: (output) => {
            if (requestChangesFired) return;
            requestChangesFired = true;
            const entry = activeProcesses.get(workspace.id);
            if (entry) clearEntryTimers(entry);
            activeProcesses.delete(workspace.id);
            workspacesRepository.update(workspace.id, {
              status: 'completed',
              output,
              completedAt: new Date().toISOString(),
              diffComments: JSON.stringify([]),
              // biome-ignore lint/suspicious/noExplicitAny: workspace update payload type is wider than the schema allows
            } as any);
            tasksService.update(workspace.taskId, { status: TASK_STATUS.IN_REVIEW }).catch((e) => {
              logger.warn(`${FILE_PATH} :: requestChanges - failed to move task to In Review`, e);
            });
            activityLogService.log({
              projectId: workspace.projectId,
              taskId: workspace.taskId,
              workspaceId,
              agentId: workspace.agentId,
              eventType: 'agent_completed',
              description: 'Agent completed review changes',
              metadata: {},
            });
          },
          onFailed: onFailedCallback,
        },
        spawnOpts,
      );

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
        onFailed: onFailedCallback,
        startedAt: Date.now(),
        stage: 'review',
      };
      attachWatchdog(entry, workspace.id, workspace.projectId, workspace.taskId, workspace.agentId, onFailedCallback);
      activeProcesses.set(workspace.id, entry);

      // Mark as running (don't clear comments yet — cleared on success only)
      workspacesRepository.update(workspace.id, {
        status: 'running',
        pid: result.process.pid ?? null,
        startedAt: new Date().toISOString(),
        completedAt: null,
        // biome-ignore lint/suspicious/noExplicitAny: workspace update payload type is wider than the schema allows
      } as any);

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
