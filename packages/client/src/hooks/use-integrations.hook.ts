// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { Integration, UpsertIntegration } from '@atlas/shared';

const INTEGRATIONS_KEY = ['integrations'] as const;

/** Returns all integrations. */
export function useIntegrations() {
  return useQuery({
    queryKey: INTEGRATIONS_KEY,
    queryFn: () => api.get<Integration[]>('/integrations'),
  });
}

/** Returns a single integration by name. */
export function useIntegration(name: string) {
  return useQuery({
    queryKey: [...INTEGRATIONS_KEY, name],
    queryFn: () => api.get<Integration>(`/integrations/${name}`),
  });
}

/** Upserts an integration by name. */
export function useUpsertIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: UpsertIntegration }) =>
      api.put<Integration>(`/integrations/${name}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY }),
  });
}

/** Tests the Supermemory connection with the given credentials. */
export function useTestSupermemory() {
  return useMutation({
    mutationFn: (payload: { apiKey: string; baseUrl?: string | null }) =>
      api.post<{ ok: boolean; error?: string }>('/integrations/supermemory/test', payload),
  });
}
