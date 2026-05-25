// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
    onSuccess: () => {
      toast.success('Task created');
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
    onError: (e) => toast.error(`Failed to create task: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTask }) => api.put<Task>(`/tasks/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
    onError: (e) => toast.error(`Failed to update task: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      toast.success('Task deleted');
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
    onError: (e) => toast.error(`Failed to delete task: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}
