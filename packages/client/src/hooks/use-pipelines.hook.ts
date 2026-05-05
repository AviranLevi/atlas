// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type {
  AddPipelineTasks,
  CreatePipeline,
  Pipeline,
  PipelineTask,
  PipelineWithTasks,
  ReorderPipelineTasks,
  StartPipeline,
  UpdatePipeline,
  UpdatePipelineTask,
} from '@atlas/shared';

const PIPELINES_KEY = ['pipelines'] as const;

// ── Queries ────────────────────────────────────────────────────────────────

/** Returns all pipelines for a project. */
export function usePipelines(projectId: string | undefined) {
  return useQuery({
    queryKey: [...PIPELINES_KEY, projectId],
    queryFn: () => api.get<Pipeline[]>(`/pipelines?projectId=${projectId}`),
    enabled: !!projectId,
  });
}

/** Returns a pipeline with all its tasks. Polls every 3s while running. */
export function usePipeline(id: string | undefined) {
  return useQuery({
    queryKey: [...PIPELINES_KEY, id],
    queryFn: () => api.get<PipelineWithTasks>(`/pipelines/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'running' ? 3000 : false;
    },
  });
}

// ── CRUD mutations ─────────────────────────────────────────────────────────

/** Creates a pipeline with an initial ordered task list. */
export function useCreatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePipeline) => api.post<PipelineWithTasks>('/pipelines', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

/** Renames or updates top-level pipeline fields. */
export function useUpdatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePipeline }) => api.patch<Pipeline>(`/pipelines/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

/** Deletes a pipeline. */
export function useDeletePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/pipelines/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

// ── Task mutations ─────────────────────────────────────────────────────────

/** Appends tasks to an existing pipeline. */
export function useAddPipelineTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddPipelineTasks }) =>
      api.post<PipelineWithTasks>(`/pipelines/${id}/tasks`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

/** Updates per-task settings (autoReview, autoAccept, baseStrategy). */
export function useUpdatePipelineTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, taskId, data }: { id: string; taskId: string; data: UpdatePipelineTask }) =>
      api.patch<PipelineTask>(`/pipelines/${id}/tasks/${taskId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

/** Removes a task from a pipeline. */
export function useRemovePipelineTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, taskId }: { id: string; taskId: string }) =>
      api.delete<PipelineWithTasks>(`/pipelines/${id}/tasks/${taskId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

/** Reorders tasks in a pipeline. */
export function useReorderPipelineTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReorderPipelineTasks }) =>
      api.post<PipelineWithTasks>(`/pipelines/${id}/tasks/reorder`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

// ── Lifecycle mutations ────────────────────────────────────────────────────

/** Starts a pipeline. */
export function useStartPipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StartPipeline }) =>
      api.post<PipelineWithTasks>(`/pipelines/${id}/start`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

/** Pauses a running pipeline. */
export function usePausePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Pipeline>(`/pipelines/${id}/pause`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

/** Resumes a paused pipeline. */
export function useResumePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StartPipeline }) =>
      api.post<PipelineWithTasks>(`/pipelines/${id}/resume`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}

/** Cancels a pipeline. */
export function useCancelPipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<PipelineWithTasks>(`/pipelines/${id}/cancel`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINES_KEY }),
  });
}
