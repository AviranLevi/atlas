// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Context
import { useAuth } from '@/contexts/auth.context';

// Lib
import { api } from '@/lib/api';

// Types
import type { CreateProject, GitPullResult, GitStatus, Project, ScaffoldProject, UpdateProject } from '@atlas/shared';
import type { UseMutationResult } from '@tanstack/react-query';
import type { BrowseResponse, ScanResult } from '@/components/projects/projects.types';
import type { ProjectContext, ProjectWithSummary } from '@/pages/projects/projects.types';

export type { BrowseResponse, DirectoryEntry, ScanResult } from '@/components/projects/projects.types';
export type { ProjectContext, ProjectWithSummary } from '@/pages/projects/projects.types';

const PROJECTS_KEY = ['projects'] as const;

export function useProjects() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: () => api.get<Project[]>('/projects'),
    enabled: isAuthenticated,
  });
}

export function useProjectsWithSummary() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...PROJECTS_KEY, 'summary'],
    queryFn: () => api.get<ProjectWithSummary[]>('/projects?include=summary'),
    enabled: isAuthenticated,
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
    onSuccess: (data) => {
      toast.success(`Branch "${data.branch}" created`);
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, projectId, 'branches'] });
    },
    onError: (e) => toast.error(`Failed to create branch: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useCheckoutBranch(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (branch: string) => {
      if (!projectId) throw new Error('projectId is required to checkout a branch');
      return api.post<{ branch: string }>(`/projects/${projectId}/checkout`, { branch });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, projectId, 'git-status'] });
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, projectId, 'branches'] });
      toast.success(`Switched to ${data.branch}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to switch branch');
    },
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
    onSuccess: (data) => {
      toast.success(`Imported ${data.imported} rule(s)`);
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
    onError: (e) => toast.error(`Failed to import rules: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProject) => api.post<Project>('/projects', data),
    onSuccess: (project) => {
      toast.success('Project created');
      // Write synchronously so ProjectContext and RouteGuard see the new project
      // before navigate() fires — without this the cache stays [] and the shell
      // collapses to firstRun, bouncing the user back to /welcome.
      queryClient.setQueryData<Project[]>(PROJECTS_KEY, (old = []) =>
        old.some((p) => p.id === project.id) ? old : [...old, project],
      );
      // Also update the summary cache so ProjectsPage renders the new project
      // without waiting for its own refetch.
      queryClient.setQueryData<ProjectWithSummary[]>([...PROJECTS_KEY, 'summary'], (old = []) =>
        old.some((p) => p.id === project.id)
          ? old
          : [
              ...old,
              { ...project, taskCounts: { todo: 0, inProgress: 0, inReview: 0, done: 0, total: 0 }, agentCount: 0 },
            ],
      );
      // Mark stale without refetching now — a background refetch during navigation
      // can return [] and clobber our synchronous write, collapsing the shell back
      // to firstRun. Queries will refetch naturally on next mount/focus.
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY, refetchType: 'none' });
    },
    onError: (e) => toast.error(`Failed to create project: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

/** Scaffolds a new folder, optionally initializes git, and registers it as a project. */
export function useScaffoldProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ScaffoldProject) => api.post<Project>('/projects/scaffold', data),
    onSuccess: (project) => {
      toast.success('Project scaffolded');
      queryClient.setQueryData<Project[]>(PROJECTS_KEY, (old = []) =>
        old.some((p) => p.id === project.id) ? old : [...old, project],
      );
      queryClient.setQueryData<ProjectWithSummary[]>([...PROJECTS_KEY, 'summary'], (old = []) =>
        old.some((p) => p.id === project.id)
          ? old
          : [
              ...old,
              { ...project, taskCounts: { todo: 0, inProgress: 0, inReview: 0, done: 0, total: 0 }, agentCount: 0 },
            ],
      );
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY, refetchType: 'none' });
    },
    onError: (e) => toast.error(`Failed to scaffold project: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProject }) => api.put<Project>(`/projects/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
    onError: (e) => toast.error(`Failed to update project: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      toast.success('Project deleted');
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
    onError: (e) => toast.error(`Failed to delete project: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useScanProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Project>(`/projects/${id}/scan`, {}),
    onSuccess: () => {
      toast.success('Project scan complete');
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
    onError: (e) => toast.error(`Failed to scan project: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useGenerateBrief() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Project>(`/projects/${id}/generate-brief`, {}),
    onSuccess: () => {
      toast.success('Brief generated');
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
    onError: (e) => toast.error(`Failed to generate brief: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

/** Generates a DESIGN.md for the project using AI and saves it as the design context. */
export function useGenerateDesignContext() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Project>(`/projects/${id}/generate-design-context`, {}),
    onSuccess: () => {
      toast.success('Design context generated');
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
    onError: (e) =>
      toast.error(`Failed to generate design context: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

const FILESYSTEM_KEY = ['filesystem'] as const;

/**
 * Polls origin for new commits and returns how many the local HEAD is behind.
 * Only active when `enabled` is true (i.e. project has a localPath).
 */
export function useGitStatus(projectId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, projectId, 'git-status'],
    queryFn: () => api.get<GitStatus>(`/projects/${projectId}/git-status`),
    enabled: !!projectId && enabled,
    refetchInterval: 120_000,
    staleTime: 60_000,
  });
}

/** Pulls origin/<defaultBranch> into the project's local repository. */
export function useGitPull() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => api.post<GitPullResult>(`/projects/${projectId}/git-pull`, {}),
    onSuccess: (data, projectId) => {
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, projectId, 'git-status'] });
      if (data.status === 'up-to-date') {
        toast.info('Already up to date');
      } else if (data.status === 'conflict') {
        toast.error(`Merge conflict — resolve manually`);
      } else {
        toast.success('Pulled latest changes');
      }
    },
    onError: () => toast.error('Pull failed — check the terminal for details'),
  });
}

/** Opens the project's local path in the first available editor (Cursor → VS Code → Windsurf). */
export function useOpenProjectInEditor() {
  return useMutation({
    mutationFn: (projectId: string) =>
      api.post<{ editor: string; path: string }>(`/projects/${projectId}/open-in-editor`, {}),
    onSuccess: (data) => toast.success(`Opened in ${data.editor}`),
    onError: () => toast.error('No supported editor found. Install Cursor, VS Code, or Windsurf.'),
  });
}

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
