import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AgentProvider, CreateAgentProvider, UpdateAgentProvider, ProviderModel } from '@my-agents/shared';

const PROVIDERS_KEY = ['agent-providers'] as const;
const PROVIDER_MODELS_KEY = ['agent-provider-models'] as const;

export function useAgentProviders() {
  return useQuery({
    queryKey: PROVIDERS_KEY,
    queryFn: () => api.get<AgentProvider[]>('/agent-providers'),
  });
}

export function useCreateAgentProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAgentProvider) =>
      api.post<AgentProvider>('/agent-providers', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY }),
  });
}

export function useUpdateAgentProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgentProvider }) =>
      api.put<AgentProvider>(`/agent-providers/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY }),
  });
}

export function useDeleteAgentProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/agent-providers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY }),
  });
}

export function useTestAgentProvider() {
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ ok: boolean; error?: string }>(`/agent-providers/${id}/test`, {}),
  });
}

/** Fetches available models from the provider's API. Disabled when no providerId. */
export function useProviderModels(providerId: string | undefined) {
  return useQuery({
    queryKey: [...PROVIDER_MODELS_KEY, providerId],
    queryFn: () => api.get<ProviderModel[]>(`/agent-providers/${providerId}/models`),
    enabled: !!providerId,
    staleTime: 5 * 60 * 1000,
  });
}
