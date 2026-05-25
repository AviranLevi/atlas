import type { Agent, CreateAgent, Rule, Skill, UpdateAgent } from '@atlas/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
    onSuccess: () => {
      toast.success('Agent created');
      queryClient.invalidateQueries({ queryKey: AGENTS_KEY });
    },
    onError: (e) => toast.error(`Failed to create agent: ${e instanceof Error ? e.message : 'Unknown error'}`),
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
    onError: (e) => toast.error(`Failed to update agent: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/agents/${id}`),
    onSuccess: () => {
      toast.success('Agent deleted');
      queryClient.invalidateQueries({ queryKey: AGENTS_KEY });
    },
    onError: (e) => toast.error(`Failed to delete agent: ${e instanceof Error ? e.message : 'Unknown error'}`),
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
    onSuccess: () => {
      toast.success('Skill attached');
      qc.invalidateQueries({ queryKey: AGENT_DETAIL_KEY });
    },
    onError: (e) => toast.error(`Failed to attach skill: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useDetachSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, skillId }: { agentId: string; skillId: string }) =>
      api.delete(`/agents/${agentId}/skills/${skillId}`),
    onSuccess: () => {
      toast.success('Skill detached');
      qc.invalidateQueries({ queryKey: AGENT_DETAIL_KEY });
    },
    onError: (e) => toast.error(`Failed to detach skill: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useAttachRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, ruleId }: { agentId: string; ruleId: string }) =>
      api.post(`/agents/${agentId}/rules`, { ruleId }),
    onSuccess: () => {
      toast.success('Rule attached');
      qc.invalidateQueries({ queryKey: AGENT_DETAIL_KEY });
    },
    onError: (e) => toast.error(`Failed to attach rule: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useDetachRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, ruleId }: { agentId: string; ruleId: string }) =>
      api.delete(`/agents/${agentId}/rules/${ruleId}`),
    onSuccess: () => {
      toast.success('Rule detached');
      qc.invalidateQueries({ queryKey: AGENT_DETAIL_KEY });
    },
    onError: (e) => toast.error(`Failed to detach rule: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}
