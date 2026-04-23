// Shared
import type { Workspace } from '@atlas/shared';

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
import { resolveSpawnOptions } from '../spawn/spawn-options.js';
import { attachWatchdog } from './watchdog.js';
import { buildReviewerPrompt } from './prompts.js';
import { diffService } from './diff.service.js';

const FILE_PATH = 'services/orchestrator/review/ai-reviewer.service.ts';

export class AiReviewerService {
  /**
   * Spawns a reviewer agent on a specific completed workspace. The caller
   * passes the workspace ID directly — do NOT derive it from a task ID,
   * because a task has multiple workspaces across its brainstorm→plan→execute
   * lineage and guessing picks the wrong one.
   *
   * The agent receives the diff + task context + DoD checklist and is
   * instructed to call the `submit_review` MCP tool with its decision.
   */
  async startAiReview(workspaceId: string, agentRuntimeId: string, autoFix = false): Promise<Workspace> {
    const FUNCTION_NAME = 'startAiReview';
    try {
      if (isShuttingDown()) {
        throw new AppError('Server is shutting down', { status: 503 });
      }

      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'completed') {
        throw new AppError('AI review can only be started on completed workspaces', { status: 400 });
      }

      const executor = executorRegistry.getById(agentRuntimeId);
      if (!executor) {
        throw new AppError(`Unknown agent runtime: ${agentRuntimeId}`, { status: 400 });
      }

      const task = await tasksService.getById(workspace.taskId);

      // Lazy import to avoid circular dependency
      const { reviewsService } = await import('../../index.js');
      const review = await reviewsService.getByTask(workspace.taskId);

      const diff = await diffService.getDiff(workspaceId);
      const diffText = diff.files
        .map((f) => `### ${f.filename}\n\`\`\`diff\n${f.patch ?? '(no patch)'}\n\`\`\``)
        .join('\n\n');

      const reviewPrompt = buildReviewerPrompt({
        taskName: task.name,
        taskNotes: task.notes,
        checklist: review?.checklist ?? [],
        diffText,
        autoFix,
        reviewId: review?.id,
      });

      const { spawnOpts } = await resolveSpawnOptions(executor, task.agentId, undefined, undefined);

      const cwd = executor.usesProjectRoot
        ? ((await projectsService.getById(workspace.projectId)).localPath ?? workspace.worktreePath)
        : workspace.worktreePath;

      let reviewFired = false;
      const onFailedReview = (output: string, error?: string) => {
        if (reviewFired) return;
        reviewFired = true;
        const entry = activeProcesses.get(workspaceId);
        if (entry) clearEntryTimers(entry);
        activeProcesses.delete(workspaceId);
        workspacesRepository.update(workspaceId, {
          status: 'failed',
          output,
          completedAt: new Date().toISOString(),
          currentStage: null,
        });
        logger.error(`${FILE_PATH} :: ${FUNCTION_NAME} - reviewer agent failed`, error);
      };

      const result = await spawnAgent(workspaceId, executor, cwd, reviewPrompt, {
        onCompleted: (output) => {
          if (reviewFired) return;
          reviewFired = true;
          const entry = activeProcesses.get(workspaceId);
          if (entry) clearEntryTimers(entry);
          activeProcesses.delete(workspaceId);
          workspacesRepository.update(workspaceId, {
            status: 'completed',
            output,
            completedAt: new Date().toISOString(),
            currentStage: null,
          });
          activityLogService.log({
            projectId: workspace.projectId,
            taskId: workspace.taskId,
            workspaceId,
            eventType: 'agent_completed',
            description: 'AI reviewer completed',
            metadata: {},
          });
        },
        onFailed: onFailedReview,
        ...spawnOpts,
      });

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

      const reviewEntry: ActiveProcessEntry = {
        process: result.process,
        onFailed: onFailedReview,
        startedAt: Date.now(),
        stage: 'review',
      };
      attachWatchdog(
        reviewEntry,
        workspaceId,
        workspace.projectId,
        workspace.taskId,
        workspace.agentId,
        onFailedReview,
      );
      activeProcesses.set(workspaceId, reviewEntry);
      workspacesRepository.update(workspaceId, {
        pid: result.process.pid ?? null,
        status: 'running',
        currentStage: 'review',
      });

      activityLogService.log({
        projectId: workspace.projectId,
        taskId: workspace.taskId,
        workspaceId,
        eventType: 'agent_started',
        description: 'AI reviewer started',
        metadata: { agentRuntime: agentRuntimeId },
      });

      return workspacesRepository.findByIdOrThrow(workspaceId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to start AI review', { cause: error });
    }
  }
}

export const aiReviewerService = new AiReviewerService();
