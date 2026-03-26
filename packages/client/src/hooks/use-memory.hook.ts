import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Memory, CreateMemory, UpdateMemory } from '@atlas/shared';

const MEMORY_KEY = ['memory'] as const;

type MemoryFilters = {
  type?: string;
  scope?: string;
  search?: string;
  projectId?: string;
};

export function useMemories(filters?: MemoryFilters) {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.scope) params.set('scope', filters.scope);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.projectId) params.set('projectId', filters.projectId);
  const query = params.toString();
  return useQuery({
    queryKey: [...MEMORY_KEY, filters],
    queryFn: () =>
      api.get<Memory[]>(query ? `/memory?${query}` : '/memory'),
  });
}

export function useMemory(id: string | undefined) {
  return useQuery({
    queryKey: [...MEMORY_KEY, id],
    queryFn: () => api.get<Memory>(`/memory/${id}`),
    enabled: !!id,
  });
}

export function useCreateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemory) =>
      api.post<Memory>('/memory', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMORY_KEY }),
  });
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemory }) =>
      api.put<Memory>(`/memory/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMORY_KEY }),
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/memory/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMORY_KEY }),
  });
}
