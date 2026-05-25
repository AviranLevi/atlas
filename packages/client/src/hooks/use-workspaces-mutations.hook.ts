// React / library
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Hooks
import { PIPELINES_KEY } from '@/hooks/use-pipelines.hook';
import { REVIEWS_KEY } from '@/hooks/use-reviews.hook';
import { RUNTIMES_KEY, WORKSPACES_KEY } from '@/hooks/use-workspaces-queries.hook';

// Lib
import { api } from '@/lib/api';

// Types
import type { ExecutorStatus, Workspace } from '@atlas/shared';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Unknown error');

export function useRefreshRuntimes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<ExecutorStatus[]>('/workspaces/agent-runtimes/refresh', {}),
    onSuccess: (data) => {
      queryClient.setQueryData(RUNTIMES_KEY, data);
      toast.success('Agent runtimes refreshed');
    },
    onError: (e) => toast.error(`Failed to refresh runtimes: ${errMsg(e)}`),
  });
}

export function useStartWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      taskId: string;
      agentRuntimeId: string;
      baseBranch?: string;
      model?: string;
      providerId?: string;
      workflowEnabled?: boolean;
    }) => api.post<Workspace>('/workspaces', data),
    onSuccess: () => {
      toast.success('Agent started');
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (e) => toast.error(`Failed to start agent: ${errMsg(e)}`),
  });
}

/** Opens the workspace's worktree path in the first available editor (Cursor → VS Code → Windsurf). */
export function useOpenWorkspaceInEditor() {
  return useMutation({
    mutationFn: (workspaceId: string) =>
      api.post<{ editor: string; path: string }>(`/workspaces/${workspaceId}/open-in-editor`, {}),
    onSuccess: (data) => toast.success(`Opened in ${data.editor}`),
    onError: () => toast.error('No supported editor found. Install Cursor, VS Code, or Windsurf.'),
  });
}

/** Advances a workflow from a specific workspace to the next stage. */
export function useAdvanceWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { workspaceId: string; selectedApproach?: string }) =>
      api.post<Workspace>(`/workspaces/${params.workspaceId}/advance`, {
        selectedApproach: params.selectedApproach,
      }),
    onSuccess: () => {
      toast.success('Workflow advanced to next stage');
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: PIPELINES_KEY });
    },
    onError: (e) => toast.error(`Failed to advance workflow: ${errMsg(e)}`),
  });
}

/**
 * Rejects the workflow output from a specific workspace. Server marks the
 * workspace as `stopped` and sends the task back to To Do atomically, so the
 * view state machine stops mapping this workspace to `awaitingApproval`.
 */
export function useRejectWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => api.post<Workspace>(`/workspaces/${workspaceId}/reject`, {}),
    onSuccess: () => {
      toast.success('Workflow rejected — task returned to To Do');
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: PIPELINES_KEY });
    },
    onError: (e) => toast.error(`Failed to reject workflow: ${errMsg(e)}`),
  });
}

/**
 * Spawns an AI reviewer on a specific workspace. The workspace ID is the
 * address of truth — a task has multiple workspaces across its
 * brainstorm→plan→execute lineage.
 */
export function useStartAiReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      agentRuntimeId,
      autoFix,
    }: {
      workspaceId: string;
      agentRuntimeId: string;
      autoFix?: boolean;
    }) => api.post<Workspace>(`/workspaces/${workspaceId}/start-ai-review`, { agentRuntimeId, autoFix }),
    onSuccess: () => {
      toast.success('AI review started');
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: REVIEWS_KEY });
    },
    onError: (e) => toast.error(`Failed to start AI review: ${errMsg(e)}`),
  });
}

/**
 * Spawns an implementer on a `completed` workspace whose review is
 * `changes_requested`, feeding the reviewer's notes + unchecked checklist
 * items as prompt context. Server resets the review to `pending` so the next
 * reviewer cycle starts clean.
 */
export function useApplyReviewFix() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, agentRuntimeId }: { workspaceId: string; agentRuntimeId: string }) =>
      api.post<Workspace>(`/workspaces/${workspaceId}/apply-review-fix`, { agentRuntimeId }),
    onSuccess: () => {
      toast.success('Review fix agent started');
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: REVIEWS_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (e) => toast.error(`Failed to apply review fix: ${errMsg(e)}`),
  });
}

export function useStopWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Workspace>(`/workspaces/${id}/stop`, {}),
    onSuccess: () => {
      toast.success('Agent stopped');
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: PIPELINES_KEY });
    },
    onError: (e) => toast.error(`Failed to stop agent: ${errMsg(e)}`),
  });
}

export function useCleanupWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      api.delete(`/workspaces/${id}${force ? '?force=true' : ''}`),
    onSuccess: () => {
      toast.success('Workspace cleaned up');
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
    },
    onError: (e) => toast.error(`Cleanup failed: ${errMsg(e)}`),
  });
}

export function useMergeWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, skipSecretsScan }: { workspaceId: string; skipSecretsScan?: boolean }) =>
      api.post<Workspace>(`/workspaces/${workspaceId}/merge${skipSecretsScan ? '?skipSecretsScan=true' : ''}`, {}),
    onSuccess: () => {
      toast.success('Changes merged successfully');
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: PIPELINES_KEY });
    },
    onError: (e) => toast.error(`Merge failed: ${errMsg(e)}`),
  });
}

export function useCompleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => api.post<Workspace>(`/workspaces/${workspaceId}/complete`, {}),
    onSuccess: () => {
      toast.success('Workspace completed');
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: PIPELINES_KEY });
    },
    onError: (e) => toast.error(`Failed to complete workspace: ${errMsg(e)}`),
  });
}

/**
 * Re-runs a workspace using the exact same runtime, model, and provider as
 * the original.
 */
export function useRerunWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => api.post<Workspace>(`/workspaces/${workspaceId}/rerun`, {}),
    onSuccess: () => {
      toast.success('Workspace re-run started');
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: PIPELINES_KEY });
    },
    onError: (e) => toast.error(`Failed to re-run workspace: ${errMsg(e)}`),
  });
}

export function useCreatePR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      title,
      body,
      skipSecretsScan,
    }: {
      workspaceId: string;
      title?: string;
      body?: string;
      skipSecretsScan?: boolean;
    }) =>
      api.post<{ prUrl: string; prNumber: number }>(
        `/workspaces/${workspaceId}/create-pr${skipSecretsScan ? '?skipSecretsScan=true' : ''}`,
        { title, body },
      ),
    onSuccess: (data) => {
      toast.success(`PR #${data.prNumber} created`);
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
    },
    onError: (e) => toast.error(`PR creation failed: ${errMsg(e)}`),
  });
}

export function useRequestChanges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => api.post<Workspace>(`/workspaces/${workspaceId}/request-changes`, {}),
    onSuccess: () => {
      toast.success('Changes requested — agent will resume');
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (e) => toast.error(`Failed to request changes: ${errMsg(e)}`),
  });
}

export function useAddDiffComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      comment,
    }: {
      workspaceId: string;
      comment: { filename: string; lineNumber: number; lineContent: string; body: string; parentId?: string };
    }) => api.post<Workspace>(`/workspaces/${workspaceId}/comments`, comment),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: [...WORKSPACES_KEY, workspaceId] });
    },
    onError: (e) => toast.error(`Failed to add comment: ${errMsg(e)}`),
  });
}

export function useEditDiffComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, commentId, body }: { workspaceId: string; commentId: string; body: string }) =>
      api.post<Workspace>(`/workspaces/${workspaceId}/comments/${commentId}`, { body }),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: [...WORKSPACES_KEY, workspaceId] });
    },
    onError: (e) => toast.error(`Failed to edit comment: ${errMsg(e)}`),
  });
}

export function useRemoveDiffComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, commentId }: { workspaceId: string; commentId: string }) =>
      api.delete(`/workspaces/${workspaceId}/comments/${commentId}`),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: [...WORKSPACES_KEY, workspaceId] });
    },
    onError: (e) => toast.error(`Failed to remove comment: ${errMsg(e)}`),
  });
}

/** Reverts a workspace branch to a previous commit by SHA. */
export function useRevertWorkspaceCommit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, commitSha }: { id: string; commitSha: string }) =>
      api.post(`/workspaces/${id}/revert`, { commitSha }),
    onSuccess: (_, { id }) => {
      toast.success('Commit reverted');
      queryClient.invalidateQueries({ queryKey: [...WORKSPACES_KEY, id, 'commits'] });
      queryClient.invalidateQueries({ queryKey: [...WORKSPACES_KEY, id, 'diff'] });
    },
    onError: (e) => toast.error(`Failed to revert commit: ${errMsg(e)}`),
  });
}
