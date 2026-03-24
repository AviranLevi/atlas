// React / library
import { useQuery } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { Rule } from '@my-agents/shared';

interface RuleDetail {
  rule: Rule;
  agents: { id: string; name: string }[];
}

const RULE_DETAIL_KEY = ['rule-detail'] as const;

/** Fetches a rule with its associated agents. */
export function useRuleDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...RULE_DETAIL_KEY, id],
    queryFn: () => api.get<RuleDetail>(`/rules/${id}/detail`),
    enabled: !!id,
  });
}
