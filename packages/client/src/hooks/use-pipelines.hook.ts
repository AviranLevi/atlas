// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
  UpdatePipeline,
  UpdatePipelineTask,
} from '@atlas/shared';

export const PIPELINES_KEY = ['pipelines'] as const;

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
      // Pipeline advancement cascades from workspace transitions, which the SSE
      // event bus invalidates live. Poll only while running, as a fallback.
      const status = query.state.data?.status;
      return status === 'running' ? 15000 : false;
    },
  });
}

// ── CRUD mutations ─────────────────────────────────────────────────────────

/** Creates a pipeline with an initial ordered task list. */
export function useCreatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePipeline) => api.post<PipelineWithTasks>('/pipelines', data),
    onSuccess: () => {
      toast.success('Pipeline created');
      qc.invalidateQueries({ queryKey: PIPELINES_KEY });
    },
    onError: (e) => toast.error(`Failed to create pipeline: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

/** Renames or updates top-level pipeline fields. */
export function useUpdatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePipeline }) => api.patch<Pipeline>(`/pipelines/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINES_KEY }),
    onError: (e) => toast.error(`Failed to update pipeline: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

/** Deletes a pipeline. */
export function useDeletePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/pipelines/${id}`),
    onSuccess: () => {
      toast.success('Pipeline deleted');
      qc.invalidateQueries({ queryKey: PIPELINES_KEY });
    },
    onError: (e) => toast.error(`Failed to delete pipeline: ${e instanceof Error ? e.message : 'Unknown error'}`),
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
    onError: (e) => toast.error(`Failed to add tasks: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

/** Updates per-task settings (autoReview, autoAccept, baseStrategy). */
export function useUpdatePipelineTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, taskId, data }: { id: string; taskId: string; data: UpdatePipelineTask }) =>
      api.patch<PipelineTask>(`/pipelines/${id}/tasks/${taskId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINES_KEY }),
    onError: (e) => toast.error(`Failed to update task: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

/** Removes a task from a pipeline. */
export function useRemovePipelineTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, taskId }: { id: string; taskId: string }) =>
      api.delete<PipelineWithTasks>(`/pipelines/${id}/tasks/${taskId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINES_KEY }),
    onError: (e) => toast.error(`Failed to remove task: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

/** Reorders tasks in a pipeline. */
export function useReorderPipelineTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReorderPipelineTasks }) =>
      api.post<PipelineWithTasks>(`/pipelines/${id}/tasks/reorder`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PIPELINES_KEY }),
    onError: (e) => toast.error(`Failed to reorder tasks: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

// ── Lifecycle mutations ────────────────────────────────────────────────────

/** Starts a pipeline. Runtime resolved per-task from agent.defaultRuntimeId. */
export function useStartPipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<PipelineWithTasks>(`/pipelines/${id}/start`, {}),
    onSuccess: () => {
      toast.success('Pipeline started');
      qc.invalidateQueries({ queryKey: PIPELINES_KEY });
    },
    onError: (e) => toast.error(`Failed to start pipeline: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

/** Pauses a running pipeline. */
export function usePausePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Pipeline>(`/pipelines/${id}/pause`, {}),
    onSuccess: () => {
      toast.success('Pipeline paused');
      qc.invalidateQueries({ queryKey: PIPELINES_KEY });
    },
    onError: (e) => toast.error(`Failed to pause pipeline: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

/** Resumes a paused pipeline. Runtime resolved per-task from agent.defaultRuntimeId. */
export function useResumePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<PipelineWithTasks>(`/pipelines/${id}/resume`, {}),
    onSuccess: () => {
      toast.success('Pipeline resumed');
      qc.invalidateQueries({ queryKey: PIPELINES_KEY });
    },
    onError: (e) => toast.error(`Failed to resume pipeline: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

/** Cancels a pipeline. */
export function useCancelPipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<PipelineWithTasks>(`/pipelines/${id}/cancel`, {}),
    onSuccess: () => {
      toast.success('Pipeline cancelled');
      qc.invalidateQueries({ queryKey: PIPELINES_KEY });
    },
    onError: (e) => toast.error(`Failed to cancel pipeline: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}
