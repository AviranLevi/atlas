// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Lib
import { api } from '@/lib/api';

// Types
import type { CreateHeartbeatConfig, HeartbeatConfig, HeartbeatRun, UpdateHeartbeatConfig } from '@atlas/shared';

const HEARTBEAT_CONFIGS_KEY = ['heartbeat-configs'] as const;
const HEARTBEAT_HISTORY_KEY = ['heartbeat-history'] as const;

export function useHeartbeatConfigs(agentId: string | undefined) {
  return useQuery({
    queryKey: [...HEARTBEAT_CONFIGS_KEY, agentId],
    queryFn: () => api.get<HeartbeatConfig[]>(`/agents/${agentId}/heartbeats`),
    enabled: !!agentId,
  });
}

export function useCreateHeartbeatConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHeartbeatConfig) => api.post<HeartbeatConfig>(`/agents/${data.agentId}/heartbeats`, data),
    onSuccess: () => {
      toast.success('Heartbeat created');
      queryClient.invalidateQueries({ queryKey: HEARTBEAT_CONFIGS_KEY });
    },
    onError: (e) => toast.error(`Failed to create heartbeat: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useUpdateHeartbeatConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHeartbeatConfig }) =>
      api.put<HeartbeatConfig>(`/heartbeats/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HEARTBEAT_CONFIGS_KEY }),
    onError: (e) => toast.error(`Failed to update heartbeat: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useDeleteHeartbeatConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/heartbeats/${id}`),
    onSuccess: () => {
      toast.success('Heartbeat deleted');
      queryClient.invalidateQueries({ queryKey: HEARTBEAT_CONFIGS_KEY });
    },
    onError: (e) => toast.error(`Failed to delete heartbeat: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useTriggerHeartbeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<HeartbeatRun>(`/heartbeats/${id}/trigger`, {}),
    onSuccess: () => {
      toast.success('Heartbeat triggered');
      queryClient.invalidateQueries({ queryKey: HEARTBEAT_CONFIGS_KEY });
      queryClient.invalidateQueries({ queryKey: HEARTBEAT_HISTORY_KEY });
    },
    onError: (e) => toast.error(`Failed to trigger heartbeat: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useHeartbeatHistory(agentId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: [...HEARTBEAT_HISTORY_KEY, agentId],
    queryFn: () => api.get<HeartbeatRun[]>(`/agents/${agentId}/heartbeats/history?limit=${limit}`),
    enabled: !!agentId,
    refetchInterval: 30_000,
  });
}
