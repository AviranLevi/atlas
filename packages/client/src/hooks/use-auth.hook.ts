// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { ApiKey, CreateApiKeyResponse } from '@atlas/shared';

const AUTH_KEYS_KEY = ['auth', 'keys'] as const;

/** Returns all API keys (name, prefix, last used). */
export function useApiKeys() {
  return useQuery({
    queryKey: AUTH_KEYS_KEY,
    queryFn: () => api.get<ApiKey[]>('/auth/keys'),
  });
}

/** Creates a new API key. Returns the raw key once. */
export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<CreateApiKeyResponse>('/auth/keys', { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: AUTH_KEYS_KEY }),
  });
}

/** Revokes an API key by ID. */
export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/auth/keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: AUTH_KEYS_KEY }),
  });
}

/** First-time setup — creates the initial key. Only works when no keys exist. */
export function useSetupApiKey() {
  return useMutation({
    mutationFn: (name: string) => api.post<CreateApiKeyResponse>('/auth/setup', { name }),
  });
}
