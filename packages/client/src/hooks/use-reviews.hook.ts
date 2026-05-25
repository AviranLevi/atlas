// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Lib
import { api } from '@/lib/api';

// Types
import type { ChecklistItem, DecideReview, Review, UpdateReview } from '@atlas/shared';

export const REVIEWS_KEY = ['reviews'] as const;

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
    onError: (e) => toast.error(`Failed to create review: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReview }) => api.put<Review>(`/reviews/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REVIEWS_KEY }),
    onError: (e) => toast.error(`Failed to update review: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useDecideReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DecideReview }) => api.post<Review>(`/reviews/${id}/decide`, data),
    onSuccess: (_, { data }) => {
      toast.success(`Review ${data.decision === 'approved' ? 'approved' : 'changes requested'}`);
      queryClient.invalidateQueries({ queryKey: REVIEWS_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (e) => toast.error(`Failed to submit review: ${e instanceof Error ? e.message : 'Unknown error'}`),
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
    onError: (e) => toast.error(`Failed to trigger AI review: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}
