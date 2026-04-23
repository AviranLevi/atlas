// Shared
import type { Workspace, WorktreeCommit } from '@atlas/shared';

// Orchestrator sub-services
import type { DiffResult } from './shared/orchestrator.types.js';
import { workspaceSpawnService } from './spawn/workspace-spawn.service.js';
import { workflowAdvancementService } from './lifecycle/workflow-advancement.service.js';
import { workspaceControlService } from './lifecycle/workspace-control.service.js';
import { workspaceCompletionService } from './lifecycle/workspace-completion.service.js';
import { workspaceQueryService } from './lifecycle/workspace-query.service.js';
import { codeReviewService } from './review/code-review.service.js';
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
    return codeReviewService.getDiff(workspaceId);
  }

  /** Re-runs the agent on a completed workspace with review comments as context. */
  requestChanges(workspaceId: string): Promise<Workspace> {
    return codeReviewService.requestChanges(workspaceId);
  }

  /** Finds the most recent workspace for a task and starts an AI review on it. */
  startAiReviewForTask(taskId: string, agentRuntimeId: string, autoFix?: boolean): Promise<Workspace> {
    return codeReviewService.startAiReviewForTask(taskId, agentRuntimeId, autoFix);
  }

  /** Spawns a reviewer agent on an existing completed workspace. */
  startAiReview(workspaceId: string, agentRuntimeId: string, autoFix?: boolean): Promise<Workspace> {
    return codeReviewService.startAiReview(workspaceId, agentRuntimeId, autoFix);
  }

  /** Adds a review comment (or reply) to a workspace diff. */
  addDiffComment(
    workspaceId: string,
    comment: { filename: string; lineNumber: number; lineContent: string; body: string; parentId?: string },
  ): Workspace {
    return codeReviewService.addDiffComment(workspaceId, comment);
  }

  /** Edits an existing diff comment in a workspace. */
  editDiffComment(workspaceId: string, commentId: string, body: string): Workspace {
    return codeReviewService.editDiffComment(workspaceId, commentId, body);
  }

  /** Removes a diff comment from a workspace. */
  removeDiffComment(workspaceId: string, commentId: string): Workspace {
    return codeReviewService.removeDiffComment(workspaceId, commentId);
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
