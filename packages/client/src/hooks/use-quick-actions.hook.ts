// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { QuickAction, QuickActionTemplate, CreateQuickAction, UpdateQuickAction, Workspace } from '@atlas/shared';

const QUICK_ACTIONS_KEY = ['quick-actions'] as const;

export function useQuickActions(projectId?: string) {
  return useQuery({
    queryKey: [...QUICK_ACTIONS_KEY, projectId ?? 'all'],
    queryFn: () => api.get<QuickAction[]>(projectId ? `/quick-actions?projectId=${projectId}` : '/quick-actions'),
  });
}

export function useQuickAction(id: string | undefined) {
  return useQuery({
    queryKey: [...QUICK_ACTIONS_KEY, id],
    queryFn: () => api.get<QuickAction>(`/quick-actions/${id}`),
    enabled: !!id,
  });
}

export function useQuickActionTemplates() {
  return useQuery({
    queryKey: [...QUICK_ACTIONS_KEY, 'templates'],
    queryFn: () => api.get<QuickActionTemplate[]>('/quick-actions/templates'),
  });
}

export function useCreateQuickAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuickAction) => api.post<QuickAction>('/quick-actions', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUICK_ACTIONS_KEY }),
  });
}

export function useUpdateQuickAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuickAction }) =>
      api.put<QuickAction>(`/quick-actions/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUICK_ACTIONS_KEY }),
  });
}

export function useDeleteQuickAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/quick-actions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUICK_ACTIONS_KEY }),
  });
}

export function useRunQuickAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      api.post<Workspace>(`/quick-actions/${id}/run`, { projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
