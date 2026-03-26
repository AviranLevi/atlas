import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Agent } from '@atlas/shared';

type ProjectAgent = Agent & { role: string | null };

const PROJECT_AGENTS_KEY = ['project-agents'] as const;

export function useProjectAgents(projectId: string | undefined) {
  return useQuery({
    queryKey: [...PROJECT_AGENTS_KEY, projectId],
    queryFn: () => api.get<ProjectAgent[]>(`/projects/${projectId}/agents`),
    enabled: !!projectId,
  });
}

export function useAssignAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, agentId, role }: { projectId: string; agentId: string; role?: string | null }) =>
      api.post(`/projects/${projectId}/agents`, { agentId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_AGENTS_KEY });
      // Also invalidate project context since it includes agents
      queryClient.invalidateQueries({ queryKey: ['project-context'] });
    },
  });
}

export function useUnassignAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, agentId }: { projectId: string; agentId: string }) =>
      api.delete(`/projects/${projectId}/agents/${agentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_AGENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['project-context'] });
    },
  });
}
