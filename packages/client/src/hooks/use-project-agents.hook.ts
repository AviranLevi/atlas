// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Lib
import { api } from '@/lib/api';

// Types
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
      toast.success('Agent assigned to project');
      queryClient.invalidateQueries({ queryKey: PROJECT_AGENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['project-context'] });
    },
    onError: (e) => toast.error(`Failed to assign agent: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useUnassignAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, agentId }: { projectId: string; agentId: string }) =>
      api.delete(`/projects/${projectId}/agents/${agentId}`),
    onSuccess: () => {
      toast.success('Agent unassigned from project');
      queryClient.invalidateQueries({ queryKey: PROJECT_AGENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['project-context'] });
    },
    onError: (e) => toast.error(`Failed to unassign agent: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}
