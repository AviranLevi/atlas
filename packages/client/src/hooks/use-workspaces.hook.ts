// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

// Lib
import { ApiError, api } from '@/lib/api';

// Types
import type { ExecutorStatus, Workspace } from '@atlas/shared';
import type { DiffResult } from '@/components/workspaces/workspaces.types';

export type { DiffFile, DiffResult } from '@/components/workspaces/workspaces.types';

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
    queryFn: () => api.get<Workspace[]>(`/workspaces${activeOnly ? '?status=active' : ''}`),
    refetchInterval: 5000,
  });
}

export function useWorkspaceStatus(id: string | undefined) {
  return useQuery({
    queryKey: [...WORKSPACES_KEY, id],
    queryFn: () => api.get<Workspace & { fullOutput?: string }>(`/workspaces/${id}`),
    enabled: !!id,
    refetchInterval: 3000,
    retry: (failureCount, error) => {
      // Don't retry 404s (workspace was deleted after merge/cleanup)
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 3;
    },
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
    }) => api.post<Workspace>('/workspaces', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useStopWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Workspace>(`/workspaces/${id}/stop`, {}),
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
    mutationFn: (workspaceId: string) => api.post<Workspace>(`/workspaces/${workspaceId}/merge`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCompleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => api.post<Workspace>(`/workspaces/${workspaceId}/complete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useRerunWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      agentRuntimeId,
      model,
    }: {
      workspaceId: string;
      agentRuntimeId: string;
      model?: string;
    }) => api.post<Workspace>(`/workspaces/${workspaceId}/rerun`, { agentRuntimeId, model }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCreatePR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, title, body }: { workspaceId: string; title?: string; body?: string }) =>
      api.post<{ prUrl: string; prNumber: number }>(`/workspaces/${workspaceId}/create-pr`, { title, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
    },
  });
}

export function useRequestChanges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => api.post<Workspace>(`/workspaces/${workspaceId}/request-changes`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
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
  return workspaces.find((w) => w.taskId === taskId && (w.status === 'running' || w.status === 'pending'));
}

/**
 * Streams live log output from a running workspace via SSE.
 * Returns the accumulated log text while active; null when idle.
 */
export function useWorkspaceLogStream(workspaceId: string | undefined, isActive: boolean) {
  const [log, setLog] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!workspaceId || !isActive) {
      setLog(null);
      return;
    }

    setLog('');
    const es = new EventSource(`/api/v1/workspaces/${workspaceId}/logs/stream`);
    esRef.current = es;

    es.addEventListener('log', (e) => {
      try {
        const chunk = JSON.parse((e as MessageEvent).data) as string;
        setLog((prev) => (prev ?? '') + chunk);
      } catch {
        setLog((prev) => (prev ?? '') + (e as MessageEvent).data);
      }
    });

    es.addEventListener('done', () => {
      es.close();
      esRef.current = null;
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [workspaceId, isActive]);

  return log;
}
