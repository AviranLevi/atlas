// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { CreateTask, Task, UpdateTask } from '@atlas/shared';

const TASKS_KEY = ['tasks'] as const;

type TaskFilters = {
  status?: string;
  projectId?: string;
  agentId?: string;
};

export function useTasks(filters?: TaskFilters) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.projectId) params.set('projectId', filters.projectId);
  if (filters?.agentId) params.set('agentId', filters.agentId);
  const query = params.toString();
  return useQuery({
    queryKey: [...TASKS_KEY, filters],
    queryFn: () => api.get<Task[]>(query ? `/tasks?${query}` : '/tasks'),
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: [...TASKS_KEY, id],
    queryFn: () => api.get<Task>(`/tasks/${id}`),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTask) => api.post<Task>('/tasks', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTask }) => api.put<Task>(`/tasks/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}
