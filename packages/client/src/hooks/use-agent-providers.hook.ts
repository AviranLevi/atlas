// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Lib
import { api } from '@/lib/api';

// Types
import type {
  AgentProvider,
  CreateAgentProvider,
  ProviderModel,
  ProviderType,
  UpdateAgentProvider,
} from '@atlas/shared';

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
    mutationFn: (data: CreateAgentProvider) => api.post<AgentProvider>('/agent-providers', data),
    onSuccess: () => {
      toast.success('Provider created');
      queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY });
    },
    onError: (e) => toast.error(`Failed to create provider: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useUpdateAgentProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgentProvider }) =>
      api.put<AgentProvider>(`/agent-providers/${id}`, data),
    onSuccess: () => {
      toast.success('Provider updated');
      queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY });
    },
    onError: (e) => toast.error(`Failed to update provider: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useDeleteAgentProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/agent-providers/${id}`),
    onSuccess: () => {
      toast.success('Provider deleted');
      queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY });
    },
    onError: (e) => toast.error(`Failed to delete provider: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useTestAgentProvider() {
  return useMutation({
    mutationFn: (id: string) => api.post<{ ok: boolean; error?: string }>(`/agent-providers/${id}/test`, {}),
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

/** Fetches models using ephemeral credentials (no saved provider required). */
export function useInlineProviderModels() {
  return useMutation({
    mutationFn: (data: { type: ProviderType; apiKey?: string | null; baseUrl?: string | null }) =>
      api.post<ProviderModel[]>('/agent-providers/models', data),
  });
}
