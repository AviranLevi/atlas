import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Phase, CreatePhase, UpdatePhase } from '@atlas/shared';

const PHASES_KEY = ['phases'] as const;

export function usePhases(projectId: string | undefined) {
  return useQuery({
    queryKey: [...PHASES_KEY, projectId],
    queryFn: () => api.get<Phase[]>(`/phases?projectId=${projectId}`),
    enabled: !!projectId,
  });
}

export function useCreatePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePhase) => api.post<Phase>('/phases', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PHASES_KEY }),
  });
}

export function useUpdatePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePhase }) =>
      api.put<Phase>(`/phases/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PHASES_KEY }),
  });
}

export function useDeletePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/phases/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PHASES_KEY }),
  });
}
