// Shared
import type { Workspace, WorktreeCommit } from '@atlas/shared';

// Orchestrator sub-services
import type { DiffResult } from './shared/orchestrator.types.js';
import { workspaceSpawnService } from './spawn/workspace-spawn.service.js';
import { workflowAdvancementService } from './lifecycle/workflow-advancement.service.js';
import { workspaceControlService } from './lifecycle/workspace-control.service.js';
import { workspaceCompletionService } from './lifecycle/workspace-completion.service.js';
import { workspaceQueryService } from './lifecycle/workspace-query.service.js';
import { diffService } from './review/diff.service.js';
import { diffCommentsService } from './review/diff-comments.service.js';
import { requestChangesService } from './review/request-changes.service.js';
import { aiReviewerService } from './review/ai-reviewer.service.js';
import { applyReviewFixService } from './review/apply-review-fix.service.js';
import { gitHistoryService } from './git-history/index.js';

/**
 * Facade that delegates all orchestration operations to focused sub-services.
 * Keep this file thin — logic lives in the sub-services.
 */
export class OrchestratorService {
  // ─── Spawn ────────────────────────────────────────────────────────────────

  /**
   * Creates a worktree, spawns the agent process, and opens a workspace.
   *
   * Provider is resolved from the task itself (`task.workflowProviderId`,
   * then `task.agentId.providerId`). Callers who want a specific provider
   * must persist it to `task.workflowProviderId` before calling this.
   */
  startWork(
    taskId: string,
    agentRuntimeId: string,
    baseBranch?: string,
    model?: string,
    workflowStage?: 'brainstorm' | 'plan' | 'execute' | null,
    parentWorkspaceId?: string,
  ): Promise<Workspace> {
    return workspaceSpawnService.startWork(taskId, agentRuntimeId, baseBranch, model, workflowStage, parentWorkspaceId);
  }

  /**
   * Persists the chosen provider/workflow state on the task and then starts
   * a workspace. This is the entry point that HTTP and MCP callers should
   * use — `startWork` itself reads provider data from the task row, so any
   * caller-supplied providerId MUST be persisted first.
   *
   * `workflowEnabled` semantics:
   *   - true  → workflowEnabled=true, workflowStage='brainstorm'
   *   - false → workflowEnabled=false, workflowStage=null
   *   - undefined (e.g. MCP) → leave workflow flags untouched
   */
  async prepareAndStartWork(input: {
    taskId: string;
    agentRuntimeId: string;
    baseBranch?: string;
    model?: string;
    providerId?: string;
    workflowEnabled?: boolean;
  }): Promise<Workspace> {
    const { taskId, agentRuntimeId, baseBranch, model, providerId, workflowEnabled } = input;

    // Dynamic import avoids a static cycle with services/index.js — tasks
    // and orchestrator are both registered there as singletons, and we need
    // the singleton (not a fresh instance) so any in-flight task state is
    // visible to other callers.
    const { tasksService } = await import('../index.js');

    if (workflowEnabled === true) {
      await tasksService.update(taskId, {
        workflowEnabled: true,
        workflowStage: 'brainstorm',
        workflowProviderId: providerId ?? null,
      });
    } else if (workflowEnabled === false) {
      await tasksService.update(taskId, {
        workflowEnabled: false,
        workflowStage: null,
        // Even for non-workflow tasks, remember which provider the user picked
        // so CLI credential injection and potential future reruns stay stable.
        workflowProviderId: providerId ?? null,
      });
    } else if (providerId) {
      await tasksService.update(taskId, { workflowProviderId: providerId });
    }

    return this.startWork(taskId, agentRuntimeId, baseBranch, model);
  }

  // ─── Workflow advancement ──────────────────────────────────────────────────

  /** Advances a workflow task to the next stage (brainstorm → plan → execute). */
  advanceWorkflow(taskId: string): Promise<Workspace> {
    return workflowAdvancementService.advanceWorkflow(taskId);
  }

  /** Advances a workflow from a specific workspace ID to the next stage. */
  advanceWorkflowFromWorkspace(workspaceId: string, selectedApproach?: string): Promise<Workspace> {
    return workflowAdvancementService.advanceWorkflowFromWorkspace(workspaceId, selectedApproach);
  }

  /** Rejects the workflow output from a specific workspace (stops workspace, sends task back to To Do). */
  rejectWorkflowFromWorkspace(workspaceId: string): Promise<Workspace> {
    return workflowAdvancementService.rejectWorkflowFromWorkspace(workspaceId);
  }

  // ─── Control ──────────────────────────────────────────────────────────────

  /** Kills the agent process and optionally resets the task status. */
  stopWork(workspaceId: string, resetTaskStatus?: boolean): Promise<Workspace> {
    return workspaceControlService.stopWork(workspaceId, resetTaskStatus);
  }

  /** Stops the process, removes the worktree, and deletes the MCP config. */
  cleanup(workspaceId: string): Promise<void> {
    return workspaceControlService.cleanup(workspaceId);
  }

  /**
   * Re-runs a failed, stopped, or completed workspace.
   *
   * The new workspace inherits runtime, model, and provider from the original
   * run verbatim — there are no overrides. Provider is resolved via
   * `task.workflowProviderId` (preserved by cleanup), so API-provider runs
   * stay on the API provider and CLI runs stay on CLI.
   */
  rerun(workspaceId: string): Promise<Workspace> {
    return workspaceControlService.rerun(workspaceId);
  }

  // ─── Code review ──────────────────────────────────────────────────────────

  /** Returns the git diff for a workspace (empty if worktree is gone). */
  getDiff(workspaceId: string): Promise<DiffResult> {
    return diffService.getDiff(workspaceId);
  }

  /** Re-runs the agent on a completed workspace with review comments as context. */
  requestChanges(workspaceId: string): Promise<Workspace> {
    return requestChangesService.requestChanges(workspaceId);
  }

  /** Spawns a reviewer agent on an existing completed workspace. */
  startAiReview(workspaceId: string, agentRuntimeId: string, autoFix?: boolean): Promise<Workspace> {
    return aiReviewerService.startAiReview(workspaceId, agentRuntimeId, autoFix);
  }

  /**
   * Spawns an implementer to apply the reviewer's requested fixes on a
   * completed workspace whose review is `changes_requested`.
   */
  applyReviewFix(workspaceId: string, agentRuntimeId: string): Promise<Workspace> {
    return applyReviewFixService.applyReviewFix(workspaceId, agentRuntimeId);
  }

  /** Adds a review comment (or reply) to a workspace diff. */
  addDiffComment(
    workspaceId: string,
    comment: { filename: string; lineNumber: number; lineContent: string; body: string; parentId?: string },
  ): Workspace {
    return diffCommentsService.addDiffComment(workspaceId, comment);
  }

  /** Edits an existing diff comment in a workspace. */
  editDiffComment(workspaceId: string, commentId: string, body: string): Workspace {
    return diffCommentsService.editDiffComment(workspaceId, commentId, body);
  }

  /** Removes a diff comment from a workspace. */
  removeDiffComment(workspaceId: string, commentId: string): Workspace {
    return diffCommentsService.removeDiffComment(workspaceId, commentId);
  }

  // ─── Completion ───────────────────────────────────────────────────────────

  /** Merges the worktree branch, moves task to Done, and archives logs. */
  mergeAndClose(workspaceId: string): Promise<Workspace> {
    return workspaceCompletionService.mergeAndClose(workspaceId);
  }

  /** Completes a workspace without merging code changes. */
  completeWithoutMerge(workspaceId: string): Promise<Workspace> {
    return workspaceCompletionService.completeWithoutMerge(workspaceId);
  }

  /** Pushes the branch and creates a GitHub pull request via gh CLI. */
  createPullRequest(
    workspaceId: string,
    opts?: { title?: string; body?: string },
  ): Promise<{ prUrl: string; prNumber: number }> {
    return workspaceCompletionService.createPullRequest(workspaceId, opts);
  }

  // ─── Query ────────────────────────────────────────────────────────────────

  /** Returns workspace status with optional full log output. */
  getStatus(workspaceId: string): Promise<(Workspace & { fullOutput?: string }) | null> {
    return workspaceQueryService.getStatus(workspaceId);
  }

  /** Returns all pending and running workspaces. */
  listActive(): Promise<Workspace[]> {
    return workspaceQueryService.listActive();
  }

  /** Returns all workspaces. */
  listAll(): Promise<Workspace[]> {
    return workspaceQueryService.listAll();
  }

  /** Checks PIDs on startup and kills/marks orphaned workspaces as failed. */
  reconcileOnStartup(): void {
    workspaceQueryService.reconcileOnStartup();
  }

  /** Lists metadata for all archived workspace log files. */
  listArchivedLogs(): { filename: string; size: number; createdAt: string }[] {
    return workspaceQueryService.listArchivedLogs();
  }

  /** Returns the content of an archived log file. Prevents path traversal. */
  getArchivedLog(filename: string): string | null {
    return workspaceQueryService.getArchivedLog(filename);
  }

  // ─── Git history ──────────────────────────────────────────────────────────

  /** Returns per-step commits for a workspace (empty for brainstorm/plan). */
  getWorkspaceCommits(workspaceId: string): Promise<WorktreeCommit[]> {
    return gitHistoryService.getWorkspaceCommits(workspaceId);
  }

  /** Resets the workspace branch to a previous commit. Forbidden while running. */
  revertWorkspaceToCommit(workspaceId: string, commitSha: string): Promise<void> {
    return gitHistoryService.revertWorkspaceToCommit(workspaceId, commitSha);
  }
}
