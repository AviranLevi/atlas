// React / libraries
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
// Utils
import { api } from '@/lib/api';
// Types
import type { Workspace, ExecutorStatus } from '@my-agents/shared';

const WORKSPACES_KEY = ['workspaces'] as const;
const RUNTIMES_KEY = ['agent-runtimes'] as const;

export function useAgentRuntimes() {
  return useQuery({
    queryKey: RUNTIMES_KEY,
    queryFn: () => api.get<ExecutorStatus[]>('/workspaces/agent-runtimes'),
    staleTime: 60_000,
  });
}

export function useRefreshRuntimes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<ExecutorStatus[]>('/workspaces/agent-runtimes/refresh', {}),
    onSuccess: (data) => {
      queryClient.setQueryData(RUNTIMES_KEY, data);
    },
  });
}

export function useWorkspaces(activeOnly = false) {
  return useQuery({
    queryKey: [...WORKSPACES_KEY, activeOnly ? 'active' : 'all'],
    queryFn: () =>
      api.get<Workspace[]>(`/workspaces${activeOnly ? '?status=active' : ''}`),
    refetchInterval: 5000,
  });
}

export function useWorkspaceStatus(id: string | undefined) {
  return useQuery({
    queryKey: [...WORKSPACES_KEY, id],
    queryFn: () => api.get<Workspace & { fullOutput?: string }>(`/workspaces/${id}`),
    enabled: !!id,
    refetchInterval: 3000,
  });
}

export function useStartWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { taskId: string; agentRuntimeId: string }) =>
      api.post<Workspace>('/workspaces', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useStopWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<Workspace>(`/workspaces/${id}/stop`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
    },
  });
}

export function useCleanupWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/workspaces/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
    },
  });
}

export interface DiffFile {
  filename: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface DiffResult {
  files: DiffFile[];
  summary: { additions: number; deletions: number; filesChanged: number };
}

export function useWorkspaceDiff(workspaceId: string | undefined) {
  return useQuery({
    queryKey: [...WORKSPACES_KEY, workspaceId, 'diff'],
    queryFn: () => api.get<DiffResult>(`/workspaces/${workspaceId}/diff`),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useMergeWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) =>
      api.post<Workspace>(`/workspaces/${workspaceId}/merge`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useAddDiffComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, comment }: {
      workspaceId: string;
      comment: { filename: string; lineNumber: number; lineContent: string; body: string };
    }) => api.post<Workspace>(`/workspaces/${workspaceId}/comments`, comment),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: [...WORKSPACES_KEY, workspaceId] });
    },
  });
}

export function useEditDiffComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, commentId, body }: {
      workspaceId: string;
      commentId: string;
      body: string;
    }) => api.post<Workspace>(`/workspaces/${workspaceId}/comments/${commentId}`, { body }),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: [...WORKSPACES_KEY, workspaceId] });
    },
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
  });
}

/** Returns the active (running/pending) workspace for a given task, if any. */
export function useActiveWorkspaceForTask(taskId: string | undefined) {
  const { data: workspaces = [] } = useWorkspaces();
  if (!taskId) return undefined;
  return workspaces.find(
    (w) => w.taskId === taskId && (w.status === 'running' || w.status === 'pending')
  );
}
