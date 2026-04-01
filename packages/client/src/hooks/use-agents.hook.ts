import type { Agent, CreateAgent, Rule, Skill, UpdateAgent } from '@atlas/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const AGENTS_KEY = ['agents'] as const;
const AGENT_DETAIL_KEY = ['agent-detail'] as const;

interface AgentDetail {
  agent: Agent;
  skills: Skill[];
  rules: Rule[];
  projects: { id: string; name: string; status: string }[];
}

// ---------------------------------------------------------------------------
// List / CRUD
// ---------------------------------------------------------------------------

export function useAgents() {
  return useQuery({
    queryKey: AGENTS_KEY,
    queryFn: () => api.get<Agent[]>('/agents'),
  });
}

export function useAgent(id: string | undefined) {
  return useQuery({
    queryKey: [...AGENTS_KEY, id],
    queryFn: () => api.get<Agent>(`/agents/${id}`),
    enabled: !!id,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAgent) => api.post<Agent>('/agents', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgent }) => api.put<Agent>(`/agents/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENTS_KEY });
      queryClient.invalidateQueries({ queryKey: AGENT_DETAIL_KEY });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/agents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}

// ---------------------------------------------------------------------------
// Detail (agent + skills + rules + projects)
// ---------------------------------------------------------------------------

export function useAgentDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...AGENT_DETAIL_KEY, id],
    queryFn: () => api.get<AgentDetail>(`/agents/${id}/detail`),
    enabled: !!id,
  });
}

export function useAttachSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, skillId }: { agentId: string; skillId: string }) =>
      api.post(`/agents/${agentId}/skills`, { skillId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENT_DETAIL_KEY }),
  });
}

export function useDetachSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, skillId }: { agentId: string; skillId: string }) =>
      api.delete(`/agents/${agentId}/skills/${skillId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENT_DETAIL_KEY }),
  });
}

export function useAttachRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, ruleId }: { agentId: string; ruleId: string }) =>
      api.post(`/agents/${agentId}/rules`, { ruleId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENT_DETAIL_KEY }),
  });
}

export function useDetachRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, ruleId }: { agentId: string; ruleId: string }) =>
      api.delete(`/agents/${agentId}/rules/${ruleId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENT_DETAIL_KEY }),
  });
}
