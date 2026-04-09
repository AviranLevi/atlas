// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { CreateMemory, Memory, UpdateMemory } from '@atlas/shared';

const MEMORY_KEY = ['memory'] as const;

type MemoryFilters = {
  type?: string;
  scope?: string;
  status?: string;
  search?: string;
  projectId?: string;
};

/** Returns all memory entries, optionally filtered. */
export function useMemories(filters?: MemoryFilters) {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.scope) params.set('scope', filters.scope);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.projectId) params.set('projectId', filters.projectId);
  const query = params.toString();
  return useQuery({
    queryKey: [...MEMORY_KEY, filters],
    queryFn: () => api.get<Memory[]>(query ? `/memory?${query}` : '/memory'),
  });
}

/** Returns a single memory entry by ID. */
export function useMemory(id: string | undefined) {
  return useQuery({
    queryKey: [...MEMORY_KEY, id],
    queryFn: () => api.get<Memory>(`/memory/${id}`),
    enabled: !!id,
  });
}

/** Creates a new memory entry. */
export function useCreateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemory) => api.post<Memory>('/memory', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMORY_KEY }),
  });
}

/** Updates a memory entry by ID. */
export function useUpdateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemory }) => api.put<Memory>(`/memory/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMORY_KEY }),
  });
}

/** Deletes a memory entry by ID. */
export function useDeleteMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/memory/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMORY_KEY }),
  });
}

/** Toggles the isPinned flag on a memory entry. */
export function useTogglePinMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) => api.put<Memory>(`/memory/${id}`, { isPinned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMORY_KEY }),
  });
}
