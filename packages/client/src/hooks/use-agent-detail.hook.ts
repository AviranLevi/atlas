// React / library
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { Agent, Skill, Rule } from '@my-agents/shared';

interface AgentDetail {
  agent: Agent;
  skills: Skill[];
  rules: Rule[];
  projects: { id: string; name: string; status: string }[];
}

const AGENT_DETAIL_KEY = ['agent-detail'] as const;

/** Fetches full agent detail including skills, rules, and projects. */
export function useAgentDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...AGENT_DETAIL_KEY, id],
    queryFn: () => api.get<AgentDetail>(`/agents/${id}/detail`),
    enabled: !!id,
  });
}

/** Attaches a skill to an agent. */
export function useAttachSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, skillId }: { agentId: string; skillId: string }) =>
      api.post(`/agents/${agentId}/skills`, { skillId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENT_DETAIL_KEY }),
  });
}

/** Detaches a skill from an agent. */
export function useDetachSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, skillId }: { agentId: string; skillId: string }) =>
      api.delete(`/agents/${agentId}/skills/${skillId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENT_DETAIL_KEY }),
  });
}

/** Attaches a rule to an agent. */
export function useAttachRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, ruleId }: { agentId: string; ruleId: string }) =>
      api.post(`/agents/${agentId}/rules`, { ruleId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENT_DETAIL_KEY }),
  });
}

/** Detaches a rule from an agent. */
export function useDetachRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, ruleId }: { agentId: string; ruleId: string }) =>
      api.delete(`/agents/${agentId}/rules/${ruleId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENT_DETAIL_KEY }),
  });
}
