// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { CreateSkill, Skill, UpdateSkill } from '@atlas/shared';

const SKILLS_KEY = ['skills'] as const;
const SKILL_DETAIL_KEY = ['skill-detail'] as const;

interface SkillDetail {
  skill: Skill;
  agents: { id: string; name: string }[];
}

// ---------------------------------------------------------------------------
// List / CRUD
// ---------------------------------------------------------------------------

export function useSkills() {
  return useQuery({
    queryKey: SKILLS_KEY,
    queryFn: () => api.get<Skill[]>('/skills'),
  });
}

export function useSkill(id: string | undefined) {
  return useQuery({
    queryKey: [...SKILLS_KEY, id],
    queryFn: () => api.get<Skill>(`/skills/${id}`),
    enabled: !!id,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSkill) => api.post<Skill>('/skills', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SKILLS_KEY }),
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSkill }) => api.put<Skill>(`/skills/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SKILLS_KEY });
      queryClient.invalidateQueries({ queryKey: SKILL_DETAIL_KEY });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/skills/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SKILLS_KEY }),
  });
}

// ---------------------------------------------------------------------------
// Detail (skill + associated agents)
// ---------------------------------------------------------------------------

export function useSkillDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...SKILL_DETAIL_KEY, id],
    queryFn: () => api.get<SkillDetail>(`/skills/${id}/detail`),
    enabled: !!id,
  });
}
