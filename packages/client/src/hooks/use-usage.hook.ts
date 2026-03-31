import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { UsageSummary } from '@atlas/shared';

const USAGE_KEY = ['usage'] as const;

export function useUsageSummary(
  groupBy: 'agent' | 'project' = 'agent',
  period: '7d' | '30d' | 'all' = '30d',
  projectId?: string,
) {
  return useQuery({
    queryKey: [...USAGE_KEY, groupBy, period, projectId],
    queryFn: () => {
      const params = new URLSearchParams({ groupBy, period });
      if (projectId) params.set('projectId', projectId);
      return api.get<UsageSummary>(`/usage/summary?${params}`);
    },
  });
}
