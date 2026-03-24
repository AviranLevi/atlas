// React / library
import { useQuery } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { Skill } from '@my-agents/shared';

interface SkillDetail {
  skill: Skill;
  agents: { id: string; name: string }[];
}

const SKILL_DETAIL_KEY = ['skill-detail'] as const;

/** Fetches a skill with its associated agents. */
export function useSkillDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...SKILL_DETAIL_KEY, id],
    queryFn: () => api.get<SkillDetail>(`/skills/${id}/detail`),
    enabled: !!id,
  });
}
