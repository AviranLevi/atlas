// External
import fs from 'node:fs';

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
import type { DiffResult } from '../shared/orchestrator.types.js';
import { activeProcesses, clearEntryTimers, isShuttingDown } from '../shared/active-processes.js';
import type { ActiveProcessEntry } from '../shared/active-processes.js';
import { AppError } from '../../../lib/errors.js';
import { getMaxRuntimeMs } from '../../../lib/runtime-limits.js';
import { logger } from '../../../lib/logger.js';
import { WorktreeService } from '../../worktree/index.js';
import { buildPrompt, resolveSpawnOptions } from '../spawn/spawn-options.js';

const FILE_PATH = 'services/orchestrator/code-review.service.ts';

export class CodeReviewService {
  private worktreeService = new WorktreeService();

  /**
   * Attaches watchdog + soft-warn timers to a live review/auto-fix workspace.
   * Review-stage timeout (default 15 min) is shorter than execute because
   * reviewers aren't writing code — they shouldn't run long.
   */
  private attachWatchdog(
    entry: ActiveProcessEntry,
    workspaceId: string,
    projectId: string,
    taskId: string,
    agentId: string | null,
    onFailed: (output: string, error?: string) => void,
  ): void {
    const maxRuntimeMs = getMaxRuntimeMs('review');

    entry.softWarnTimer = setTimeout(() => {
      const remainingMs = maxRuntimeMs * 0.1;
      activityLogService.log({
        projectId,
        taskId,
        workspaceId,
        agentId,
        eventType: 'agent_warning',
        description: `Review approaching runtime limit. Will terminate at ${new Date(Date.now() + remainingMs).toISOString()}.`,
        metadata: { maxRuntimeMs, stage: 'review' },
      });
      logger.warn(`${FILE_PATH} :: watchdog - review workspace ${workspaceId} at 90% of ${maxRuntimeMs}ms budget`);
    }, maxRuntimeMs * 0.9);
    entry.softWarnTimer.unref();

    entry.watchdogTimer = setTimeout(() => {
      logger.warn(
        `${FILE_PATH} :: watchdog - review workspace ${workspaceId} exceeded ${maxRuntimeMs}ms, terminating`,
      );
      const current = activeProcesses.get(workspaceId);
      if (!current) return;
      const proc = current.process;
      if (proc.pid) {
        try {
          process.kill(-proc.pid, 'SIGTERM');
        } catch {
          try {
            proc.kill('SIGTERM');
          } catch {
            /* already dead */
          }
        }
        setTimeout(() => {
          if (!proc.killed && proc.pid) {
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
        }, 5000).unref();
      }
      onFailed(
        `[watchdog] timeout: review exceeded ${Math.round(maxRuntimeMs / 60_000)} minute limit`,
        'timeout',
      );
    }, maxRuntimeMs);
    entry.watchdogTimer.unref();
  }

  /** Returns the git diff for a workspace (empty if worktree is gone). */
  async getDiff(workspaceId: string): Promise<DiffResult> {
    const FUNCTION_NAME = 'getDiff';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      // For merged/stopped workspaces the worktree has been removed — return empty diff
      if (workspace.status === 'merged' || workspace.status === 'stopped') {
        return {
          files: [],
          summary: { additions: 0, deletions: 0, filesChanged: 0 },
        };
      }

      const project = await projectsService.getById(workspace.projectId);

      if (!project.localPath) {
        throw new AppError('Project has no local path', { status: 400 });
      }

      // Check that the worktree path still exists before calling git
      if (!fs.existsSync(workspace.worktreePath)) {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - worktree path no longer exists: ${workspace.worktreePath}`);
        return {
          files: [],
          summary: { additions: 0, deletions: 0, filesChanged: 0 },
        };
      }

      return this.worktreeService.getDiff(workspace.worktreePath, project.localPath);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get diff', { cause: error });
    }
  }

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

      const comments: Array<{ filename: string; lineNumber: number; lineContent: string; body: string }> =
        Array.isArray(workspace.diffComments) ? workspace.diffComments : [];

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

      // Format review comments into a clear section
      const commentLines = comments.map((c) => {
        return `- **${c.filename}** (line ${c.lineNumber}): "${c.body}"${c.lineContent ? `\n  Code: \`${c.lineContent}\`` : ''}`;
      });

      const reviewSection = [
        '',
        '---',
        '',
        '## Review Comments — Changes Requested',
        '',
        'The reviewer has left the following comments on your code. Please address each one:',
        '',
        ...commentLines,
        '',
        'Please fix each issue above, then commit your changes to the current branch.',
      ].join('\n');

      const fullPrompt = basePrompt + reviewSection;

      // Resolve model/provider from workspace's recorded model + agent's provider
      const { spawnOpts } = await resolveSpawnOptions(
        executor,
        workspace.agentId,
        workspace.model ?? undefined,
      );

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
      this.attachWatchdog(entry, workspace.id, workspace.projectId, workspace.taskId, workspace.agentId, onFailedCallback);
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

  /**
   * Spawns a reviewer agent on an existing completed workspace.
   * Finds the most recent workspace for a task and starts an AI review on it.
   */
  async startAiReviewForTask(taskId: string, agentRuntimeId: string, autoFix = false): Promise<Workspace> {
    const workspace = workspacesRepository.findByTaskId(taskId);
    if (!workspace) {
      throw new AppError('No workspace found for this task', { status: 404 });
    }
    return this.startAiReview(workspace.id, agentRuntimeId, autoFix);
  }

  /**
   * The agent receives the diff + task context + DoD checklist and is instructed
   * to call the `submit_review` MCP tool with its decision.
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

      const diff = await this.getDiff(workspaceId);
      const diffText = diff.files
        .map((f) => `### ${f.filename}\n\`\`\`diff\n${f.patch ?? '(no patch)'}\n\`\`\``)
        .join('\n\n');

      const checklist = review?.checklist ?? [];
      const checklistText =
        checklist.length > 0
          ? checklist.map((c: ChecklistItem) => `- [${c.checked ? 'x' : ' '}] ${c.item}`).join('\n')
          : '(no checklist items defined)';

      const reviewPrompt = [
        `# Code Review Task`,
        ``,
        `You are a code reviewer. Your job is to review the code changes below against the task requirements and definition of done.`,
        ``,
        `## Task: ${task.name}`,
        task.notes ? `\n**Notes:**\n${task.notes}` : '',
        ``,
        `## Definition of Done`,
        checklistText,
        ``,
        `## Code Changes`,
        diffText,
        ``,
        `## Instructions`,
        `Review the diff carefully. For each definition of done item, determine whether the code satisfies it.`,
        autoFix
          ? [
              `If all requirements are met, call \`submit_review\` with decision "approved".`,
              `If any requirements are NOT met, fix the issues directly in the code, commit your changes, then call \`submit_review\` with decision "approved" and notes describing what you fixed.`,
              `Only use "changes_requested" if you are unable to fix an issue yourself.`,
            ].join('\n')
          : [
              `Then call the \`submit_review\` MCP tool with:`,
              `- decision: "approved" if all requirements are met, or "changes_requested" if any are missing`,
              `- notes: a brief summary of your findings`,
              `- checklistUpdates: an array marking each item as checked/unchecked based on what the diff implements`,
            ].join('\n'),
        ``,
        `The reviewId is: "${review?.id ?? 'unknown'}"`,
      ]
        .filter(Boolean)
        .join('\n');

      const { spawnOpts } = await resolveSpawnOptions(
        executor,
        task.agentId,
        undefined,
        undefined,
      );

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
        workspacesRepository.update(workspaceId, { status: 'failed', output, completedAt: new Date().toISOString() });
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
      this.attachWatchdog(
        reviewEntry,
        workspaceId,
        workspace.projectId,
        workspace.taskId,
        workspace.agentId,
        onFailedReview,
      );
      activeProcesses.set(workspaceId, reviewEntry);
      workspacesRepository.update(workspaceId, { pid: result.process.pid ?? null, status: 'running' });

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

  /** Adds a review comment (or reply) to a workspace diff. */
  addDiffComment(
    workspaceId: string,
    comment: { filename: string; lineNumber: number; lineContent: string; body: string; parentId?: string },
  ): Workspace {
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
      // biome-ignore lint/suspicious/noExplicitAny: workspace update payload type is wider than the schema allows
    } as any);
  }

  /** Edits an existing diff comment in a workspace. */
  editDiffComment(workspaceId: string, commentId: string, body: string): Workspace {
    const workspace = workspacesRepository.findByIdOrThrow(workspaceId);
    const existing = Array.isArray(workspace.diffComments) ? [...workspace.diffComments] : [];
    // biome-ignore lint/suspicious/noExplicitAny: DiffComment type is inferred at runtime from JSON
    const idx = existing.findIndex((c: any) => c.id === commentId);
    if (idx === -1) throw new AppError('Comment not found', { status: 404 });
    existing[idx] = { ...existing[idx], body, updatedAt: new Date().toISOString() };
    return workspacesRepository.update(workspaceId, {
      diffComments: JSON.stringify(existing),
      // biome-ignore lint/suspicious/noExplicitAny: workspace update payload type is wider than the schema allows
    } as any);
  }

  /** Removes a diff comment from a workspace. */
  removeDiffComment(workspaceId: string, commentId: string): Workspace {
    const workspace = workspacesRepository.findByIdOrThrow(workspaceId);
    const existing = Array.isArray(workspace.diffComments) ? [...workspace.diffComments] : [];
    // biome-ignore lint/suspicious/noExplicitAny: DiffComment type is inferred at runtime from JSON
    const filtered = existing.filter((c: any) => c.id !== commentId);
    return workspacesRepository.update(workspaceId, {
      diffComments: JSON.stringify(filtered),
      // biome-ignore lint/suspicious/noExplicitAny: workspace update payload type is wider than the schema allows
    } as any);
  }
}

export const codeReviewService = new CodeReviewService();
