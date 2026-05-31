// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { ProviderModel, ProviderType } from '@atlas/shared';

/** Server response: cached models grouped by provider type. */
export type CachedModelsResponse = Record<string, { models: ProviderModel[]; fetchedAt: string }>;

const MODEL_CACHE_KEY = ['model-cache'] as const;

/** Fetches cached models for all provider types. */
export function useCachedModels() {
  return useQuery({
    queryKey: MODEL_CACHE_KEY,
    queryFn: () => api.get<CachedModelsResponse>('/models'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Returns cached models for a specific provider type. */
export function useCachedModelsForType(type: ProviderType | undefined): ProviderModel[] {
  const { data } = useCachedModels();
  if (!type || !data?.[type]) return [];
  return data[type].models;
}

/** Triggers a model cache refresh on the server. */
export function useRefreshModelCache() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<CachedModelsResponse>('/models/refresh', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODEL_CACHE_KEY });
    },
  });
}
