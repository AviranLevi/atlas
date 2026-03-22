import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Project,
  CreateProject,
  UpdateProject,
  Agent,
  Task,
} from '@my-agents/shared';

const PROJECTS_KEY = ['projects'] as const;

type TaskCounts = {
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
  total: number;
};

export type ProjectWithSummary = Project & {
  taskCounts: TaskCounts;
  agentCount: number;
};

export type ProjectContext = {
  project: Project;
  agents: Agent[];
  tasks: Task[];
  memories: Array<Record<string, unknown>>;
};

export function useProjects() {
  return useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: () => api.get<Project[]>('/projects'),
  });
}

export function useProjectsWithSummary() {
  return useQuery({
    queryKey: [...PROJECTS_KEY, 'summary'],
    queryFn: () => api.get<ProjectWithSummary[]>('/projects?include=summary'),
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, id],
    queryFn: () => api.get<Project>(`/projects/${id}`),
    enabled: !!id,
  });
}

export function useProjectContext(id: string | undefined) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, id, 'context'],
    queryFn: () => api.get<ProjectContext>(`/projects/${id}/context`),
    enabled: !!id,
  });
}

export function useProjectBranches(id: string | undefined) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, id, 'branches'],
    queryFn: () => api.get<string[]>(`/projects/${id}/branches`),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProject) =>
      api.post<Project>('/projects', data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProject }) =>
      api.put<Project>(`/projects/${id}`, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}

export function useScanProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Project>(`/projects/${id}/scan`, {}),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}

export function useGenerateBrief() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Project>(`/projects/${id}/generate-brief`, {}),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}
