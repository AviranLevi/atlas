// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Lib
import { api } from '@/lib/api';

// Types
import type { CreatePhase, Phase, UpdatePhase } from '@atlas/shared';

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
    onSuccess: () => {
      toast.success('Phase created');
      queryClient.invalidateQueries({ queryKey: PHASES_KEY });
    },
    onError: (e) => toast.error(`Failed to create phase: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useUpdatePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePhase }) => api.put<Phase>(`/phases/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PHASES_KEY }),
    onError: (e) => toast.error(`Failed to update phase: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useDeletePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/phases/${id}`),
    onSuccess: () => {
      toast.success('Phase deleted');
      queryClient.invalidateQueries({ queryKey: PHASES_KEY });
    },
    onError: (e) => toast.error(`Failed to delete phase: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}
