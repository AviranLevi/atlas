// Shared
import type { ChecklistItem, Workspace } from '@atlas/shared';
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
import { buildApplyFixPrompt } from './prompts.js';
import { aiReviewerService } from './ai-reviewer.service.js';

const FILE_PATH = 'services/orchestrator/review/apply-review-fix.service.ts';

export class ApplyReviewFixService {
  /**
   * Spawns an implementer on a completed workspace whose latest review is
   * `changes_requested`, feeding the reviewer's notes + unchecked checklist
   * items as prompt context. Resets the review to `pending` so that when the
   * implementer finishes the user can run AI review again cleanly.
   *
   * Parallels `requestChanges` (same worktree, same branch) but sources the
   * feedback from `review.notes` + `review.checklist` instead of inline diff
   * comments, and is triggered from the workspace page "Apply AI Suggestions"
   * button.
   */
  async applyReviewFix(workspaceId: string, agentRuntimeId: string): Promise<Workspace> {
    const FUNCTION_NAME = 'applyReviewFix';
    try {
      if (isShuttingDown()) {
        throw new AppError('Server is shutting down', { status: 503 });
      }

      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'completed') {
        throw new AppError('Apply review fix requires a completed workspace', { status: 400 });
      }

      const { reviewsService } = await import('../../index.js');
      const review = await reviewsService.getByTask(workspace.taskId);
      if (!review) {
        throw new AppError('No review found for this task', { status: 400 });
      }
      if (review.status !== 'changes_requested') {
        throw new AppError('Apply review fix requires a review with changes_requested', { status: 400 });
      }

      const project = await projectsService.getById(workspace.projectId);
      if (!project.localPath) {
        throw new AppError('Project has no local path', { status: 400 });
      }

      const executor = executorRegistry.getById(agentRuntimeId);
      if (!executor) {
        throw new AppError(`Unknown agent runtime: ${agentRuntimeId}`, { status: 400 });
      }

      const uncheckedItems = (review.checklist ?? []).filter((c: ChecklistItem) => !c.checked);

      const basePrompt = await buildPrompt({
        taskId: workspace.taskId,
        projectId: project.id,
        agentId: workspace.agentId,
        hasMcpAccess: executor.mcpConfigFormat !== 'none',
      });

      const fullPrompt = buildApplyFixPrompt(basePrompt, review.notes, uncheckedItems);

      // Capture the pre-mutation review state so every exit path (failure,
      // watchdog, user-stop) can restore it. Without this the verdict panel
      // disappears on any non-happy path because it renders off
      // `review.status !== 'pending'` — leaving the user with no UI to retry,
      // approve, or open a follow-up.
      const originalReviewStatus = review.status;
      const originalDecidedAt = review.decidedAt;

      // Reset the review so that the next reviewer run starts from pending.
      // Notes/checklist are preserved — they're historical context the human
      // may still want to read, and the prompt has already captured them.
      const { reviewsRepository } = await import('../../../db/repositories/index.js');
      reviewsRepository.update(review.id, { status: 'pending', decidedAt: null });

      // Centralised rollback — idempotent, callable from onFailed, onCancelled,
      // and the watchdog (which feeds back through onFailed). Swallows errors
      // because a failed rollback must not block the kill path.
      const restoreReview = () => {
        try {
          reviewsRepository.update(review.id, {
            status: originalReviewStatus,
            decidedAt: originalDecidedAt,
          });
        } catch (e) {
          logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to restore review state`, e);
        }
      };

      const { spawnOpts } = await resolveSpawnOptions(executor, workspace.agentId, workspace.model ?? undefined);

      let fired = false;
      const onFailed = (output: string, error?: string) => {
        if (fired) return;
        fired = true;
        const entry = activeProcesses.get(workspace.id);
        if (entry) clearEntryTimers(entry);
        activeProcesses.delete(workspace.id);
        // Roll the workspace back to its prior state so the user can try
        // again without losing the diff or the review context.
        workspacesRepository.update(workspace.id, {
          status: 'completed',
          output,
          completedAt: new Date().toISOString(),
          currentStage: null,
        });
        restoreReview();
        activityLogService.log({
          projectId: workspace.projectId,
          taskId: workspace.taskId,
          workspaceId,
          agentId: workspace.agentId,
          eventType: 'agent_failed',
          description: `Agent failed during apply-review-fix: ${error ?? 'unknown error'}`,
          metadata: { error },
        });
      };

      const cwd = executor.usesProjectRoot ? project.localPath : workspace.worktreePath;

      const result = await spawnAgent(
        workspace.id,
        executor,
        cwd,
        fullPrompt,
        {
          onCompleted: (output) => {
            if (fired) return;
            fired = true;
            const entry = activeProcesses.get(workspace.id);
            if (entry) clearEntryTimers(entry);
            activeProcesses.delete(workspace.id);
            workspacesRepository.update(workspace.id, {
              status: 'completed',
              output,
              completedAt: new Date().toISOString(),
              currentStage: null,
            });
            activityLogService.log({
              projectId: workspace.projectId,
              taskId: workspace.taskId,
              workspaceId,
              agentId: workspace.agentId,
              eventType: 'agent_completed',
              description: 'Agent completed applying reviewer fixes — triggering AI re-review',
              metadata: {},
            });
            // Auto-trigger the AI reviewer so the user doesn't have to click
            // "Run AI Review" manually after the implementer finishes. The
            // prompt already told the agent "we will re-run the review
            // afterward" — this fulfils that promise.
            aiReviewerService.startAiReview(workspace.id, agentRuntimeId).catch((e) => {
              logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to auto-trigger re-review`, e);
              // Non-fatal: workspace is completed, review is pending, user
              // can still click "Run AI Review" themselves.
              tasksService.update(workspace.taskId, { status: TASK_STATUS.IN_REVIEW }).catch(() => {});
            });
          },
          onFailed,
        },
        spawnOpts,
      );

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
        // User-stop path: restore the review so the verdict panel reappears.
        // The workspace status roll-back still happens inside `stopWork`
        // (writes `stopped`), but the review side has no other owner.
        onCancelled: restoreReview,
        startedAt: Date.now(),
        // Use 'execute' — this is an implementer run, not a reviewer run.
        // `attachWatchdog` reads this stage to pick the correct budget
        // (execute = 60m default, vs review = 15m), so mis-tagging here
        // would kill legitimate long fixes.
        stage: 'execute',
      };
      attachWatchdog(entry, workspace.id, workspace.projectId, workspace.taskId, workspace.agentId, onFailed);
      activeProcesses.set(workspace.id, entry);

      workspacesRepository.update(workspace.id, {
        status: 'running',
        pid: result.process.pid ?? null,
        startedAt: new Date().toISOString(),
        completedAt: null,
        currentStage: 'execute',
      });

      await tasksService.update(workspace.taskId, { status: TASK_STATUS.IN_PROGRESS });

      activityLogService.log({
        projectId: project.id,
        taskId: workspace.taskId,
        workspaceId,
        agentId: workspace.agentId,
        eventType: 'agent_started',
        description: 'Apply review fix started',
        metadata: { reviewId: review.id, agentRuntimeId },
      });

      return workspacesRepository.findByIdOrThrow(workspace.id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to apply review fix', { cause: error });
    }
  }
}

export const applyReviewFixService = new ApplyReviewFixService();
