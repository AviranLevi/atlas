// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { CreateProject, Project, UpdateProject } from '@atlas/shared';
import type { UseMutationResult } from '@tanstack/react-query';
import type { BrowseResponse, ScanResult } from '@/components/projects/projects.types';
import type { ProjectContext, ProjectWithSummary } from '@/pages/projects/projects-page.types';

export type { BrowseResponse, DirectoryEntry, ScanResult } from '@/components/projects/projects.types';
export type { ProjectContext, ProjectWithSummary } from '@/pages/projects/projects-page.types';

const PROJECTS_KEY = ['projects'] as const;

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

export function useCreateBranch(
  projectId: string | undefined,
): UseMutationResult<{ branch: string }, Error, { name: string; baseBranch?: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; baseBranch?: string }) => {
      if (!projectId) throw new Error('projectId is required to create a branch');
      return api.post<{ branch: string }>(`/projects/${projectId}/branches`, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, projectId, 'branches'] }),
  });
}

export function useImportProjectRules(
  projectId: string | undefined,
): UseMutationResult<
  { imported: number; ids: string[] },
  Error,
  Array<{ name: string; content: string; source: string; filePath: string }>
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: Array<{ name: string; content: string; source: string; filePath: string }>) => {
      if (!projectId) throw new Error('projectId is required to import rules');
      return api.post<{ imported: number; ids: string[] }>(`/projects/${projectId}/import-rules`, { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProject) => api.post<Project>('/projects', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProject }) => api.put<Project>(`/projects/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}

export function useScanProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Project>(`/projects/${id}/scan`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}

export function useGenerateBrief() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Project>(`/projects/${id}/generate-brief`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}

const FILESYSTEM_KEY = ['filesystem'] as const;

/** Scans a local folder and returns auto-detected project metadata. */
export function useScanFolder() {
  return useMutation({
    mutationFn: (path: string) => api.get<ScanResult>(`/filesystem/scan?path=${encodeURIComponent(path)}`),
  });
}

/** Browses a filesystem directory, returning its subdirectories. */
export function useBrowseFilesystem(path: string, enabled: boolean) {
  return useQuery({
    queryKey: [...FILESYSTEM_KEY, 'browse', path],
    queryFn: () => api.get<BrowseResponse>(`/filesystem/browse${path ? `?path=${encodeURIComponent(path)}` : ''}`),
    enabled,
  });
}
