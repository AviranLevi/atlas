import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Review, UpdateReview, DecideReview, ChecklistItem, Workspace } from '@atlas/shared';

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
    mutationFn: ({ id, data }: { id: string; data: UpdateReview }) =>
      api.put<Review>(`/reviews/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REVIEWS_KEY }),
  });
}

export function useDecideReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DecideReview }) =>
      api.post<Review>(`/reviews/${id}/decide`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEWS_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/** Spawns a reviewer agent on the workspace for this review's task. */
export function useStartAiReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, agentRuntimeId, autoFix }: { id: string; agentRuntimeId: string; autoFix?: boolean }) =>
      api.post<Workspace>(`/reviews/${id}/start-ai-review`, { agentRuntimeId, autoFix }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: REVIEWS_KEY });
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
