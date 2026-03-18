// React / libraries
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
// Utils
import { api } from '@/lib/api';
// Types
import type { Workspace } from '@my-agents/shared';

export type AgentRuntime = {
  id: string;
  name: string;
  command: string;
  args: string[];
  promptDelivery: string;
  promptFlag?: string;
  mcpConfigSupported: boolean;
};

const WORKSPACES_KEY = ['workspaces'] as const;
const RUNTIMES_KEY = ['agent-runtimes'] as const;

export function useAgentRuntimes() {
  return useQuery({
    queryKey: RUNTIMES_KEY,
    queryFn: () => api.get<AgentRuntime[]>('/workspaces/agent-runtimes'),
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
