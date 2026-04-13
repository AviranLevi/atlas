// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Lib
import { api } from '@/lib/api';

// Types
import type { CreateProjectDoc, GenerateDoc, ProjectDoc, UpdateProjectDoc } from '@atlas/shared';

const DOCS_KEY = ['project-docs'] as const;

export function useProjectDocs(projectId: string | undefined) {
  return useQuery({
    queryKey: [...DOCS_KEY, projectId],
    queryFn: () => api.get<ProjectDoc[]>(`/projects/${projectId}/docs`),
    enabled: !!projectId,
  });
}

export function useCreateProjectDoc(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectDoc) => api.post<ProjectDoc>(`/projects/${projectId}/docs`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...DOCS_KEY, projectId] });
      toast.success('Doc created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProjectDoc(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ docId, data }: { docId: string; data: UpdateProjectDoc }) =>
      api.put<ProjectDoc>(`/projects/${projectId}/docs/${docId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...DOCS_KEY, projectId] });
      toast.success('Doc updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProjectDoc(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => api.delete(`/projects/${projectId}/docs/${docId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...DOCS_KEY, projectId] });
      toast.success('Doc deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useGenerateProjectDoc(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateDoc) => api.post<ProjectDoc>(`/projects/${projectId}/docs/generate`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...DOCS_KEY, projectId] });
      toast.success('Doc generated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
