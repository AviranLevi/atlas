// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { ChecklistItem, DecideReview, Review, UpdateReview } from '@atlas/shared';

const REVIEWS_KEY = ['reviews'] as const;

export function useReview(taskId: string | undefined) {
  return useQuery({
    queryKey: [...REVIEWS_KEY, taskId],
    queryFn: () => api.get<Review | null>(`/reviews?taskId=${taskId}`),
    enabled: !!taskId,
    refetchInterval: 5000,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.post<Review>('/reviews', { taskId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REVIEWS_KEY }),
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReview }) => api.put<Review>(`/reviews/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REVIEWS_KEY }),
  });
}

export function useDecideReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DecideReview }) => api.post<Review>(`/reviews/${id}/decide`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEWS_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useTriggerAiReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      agentId,
      decision,
      notes,
      checklistUpdates,
    }: {
      id: string;
      agentId: string;
      decision: 'approved' | 'changes_requested';
      notes?: string | null;
      checklistUpdates?: ChecklistItem[];
    }) =>
      api.post<Review>(`/reviews/${id}/ai-review`, {
        agentId,
        decision,
        notes,
        checklistUpdates,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEWS_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
