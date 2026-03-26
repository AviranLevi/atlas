import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/lib/api';

const PREFS_KEY = ['preferences'] as const;

export function usePreferences() {
  return useQuery({
    queryKey: [...PREFS_KEY],
    queryFn: () => api.get<Record<string, string>>('/preferences'),
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, string>) =>
      api.put<Record<string, string>>('/preferences', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PREFS_KEY }),
  });
}
