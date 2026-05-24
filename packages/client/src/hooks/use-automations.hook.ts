// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { Automation, AutomationTemplate, CreateAutomation, UpdateAutomation, Workspace } from '@atlas/shared';

const AUTOMATIONS_KEY = ['automations'] as const;

export function useAutomations(projectId?: string) {
  return useQuery({
    queryKey: [...AUTOMATIONS_KEY, projectId ?? 'all'],
    queryFn: () => api.get<Automation[]>(projectId ? `/automations?projectId=${projectId}` : '/automations'),
  });
}

export function useAutomation(id: string | undefined) {
  return useQuery({
    queryKey: [...AUTOMATIONS_KEY, id],
    queryFn: () => api.get<Automation>(`/automations/${id}`),
    enabled: !!id,
  });
}

export function useAutomationTemplates() {
  return useQuery({
    queryKey: [...AUTOMATIONS_KEY, 'templates'],
    queryFn: () => api.get<AutomationTemplate[]>('/automations/templates'),
  });
}

export function useCreateAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAutomation) => api.post<Automation>('/automations', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AUTOMATIONS_KEY }),
  });
}

export function useUpdateAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAutomation }) =>
      api.put<Automation>(`/automations/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AUTOMATIONS_KEY }),
  });
}

export function useDeleteAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/automations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AUTOMATIONS_KEY }),
  });
}

export function useRunAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      api.post<Workspace>(`/automations/${id}/run`, { projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
