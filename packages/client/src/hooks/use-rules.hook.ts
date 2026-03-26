import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Rule,
  CreateRule,
  UpdateRule,
} from '@atlas/shared';

const RULES_KEY = ['rules'] as const;
const RULE_DETAIL_KEY = ['rule-detail'] as const;

interface RuleDetail {
  rule: Rule;
  agents: { id: string; name: string }[];
}

// ---------------------------------------------------------------------------
// List / CRUD
// ---------------------------------------------------------------------------

export function useRules(filters?: { type?: string; tag?: string }) {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.tag) params.set('tag', filters.tag);
  const query = params.toString();
  return useQuery({
    queryKey: [...RULES_KEY, filters],
    queryFn: () =>
      api.get<Rule[]>(
        query ? `/rules?${query}` : '/rules'
      ),
  });
}

export function useRule(id: string | undefined) {
  return useQuery({
    queryKey: [...RULES_KEY, id],
    queryFn: () => api.get<Rule>(`/rules/${id}`),
    enabled: !!id,
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRule) =>
      api.post<Rule>('/rules', data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: RULES_KEY }),
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRule }) =>
      api.put<Rule>(`/rules/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_KEY });
      queryClient.invalidateQueries({ queryKey: RULE_DETAIL_KEY });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/rules/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: RULES_KEY }),
  });
}

// ---------------------------------------------------------------------------
// Detail (rule + associated agents)
// ---------------------------------------------------------------------------

export function useRuleDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...RULE_DETAIL_KEY, id],
    queryFn: () => api.get<RuleDetail>(`/rules/${id}/detail`),
    enabled: !!id,
  });
}
