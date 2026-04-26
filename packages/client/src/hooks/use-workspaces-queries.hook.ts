// React / library
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

// Lib
import { ApiError, api } from '@/lib/api';

// Types
import type { ExecutorStatus, Workspace, WorktreeCommit } from '@atlas/shared';
import type { DiffResult } from '@/components/workspaces/workspaces.types';

export const WORKSPACES_KEY = ['workspaces'] as const;
export const RUNTIMES_KEY = ['agent-runtimes'] as const;

export function useAgentRuntimes() {
  return useQuery({
    queryKey: RUNTIMES_KEY,
    queryFn: () => api.get<ExecutorStatus[]>('/workspaces/agent-runtimes'),
    staleTime: 60_000,
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

/** Returns the lineage chain for a workspace (root → current). */
export function useWorkspaceLineage(workspaceId: string | undefined) {
  return useQuery({
    queryKey: [...WORKSPACES_KEY, workspaceId, 'lineage'],
    queryFn: () => api.get<Workspace[]>(`/workspaces/${workspaceId}/lineage`),
    enabled: !!workspaceId,
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

/** Returns per-step commits for a workspace, polling while the agent is running. */
export function useWorkspaceCommits(id: string | undefined, isRunning: boolean) {
  // Keep polling for 10s after the status flips away from 'running'
  // to catch the final commit (either a real step commit racing with the
  // status update, or the 'execute: … (steps not tracked)' safety-net commit).
  const [graceActive, setGraceActive] = useState(false);
  const wasRunningRef = useRef(isRunning);
  useEffect(() => {
    if (wasRunningRef.current && !isRunning) {
      setGraceActive(true);
      const t = setTimeout(() => setGraceActive(false), 10_000);
      return () => clearTimeout(t);
    }
    wasRunningRef.current = isRunning;
  }, [isRunning]);

  const shouldPoll = isRunning || graceActive;

  return useQuery({
    queryKey: [...WORKSPACES_KEY, id, 'commits'],
    queryFn: () => api.get<WorktreeCommit[]>(`/workspaces/${id}/commits`),
    enabled: !!id,
    refetchInterval: shouldPoll ? 3000 : false,
    staleTime: shouldPoll ? 0 : 1000 * 30,
  });
}

/** Returns the active (running/pending) workspace for a given task, if any. */
export function useActiveWorkspaceForTask(taskId: string | undefined) {
  const { data: workspaces = [] } = useWorkspaces();
  if (!taskId) return undefined;
  return workspaces.find((w) => w.taskId === taskId && (w.status === 'running' || w.status === 'pending'));
}
