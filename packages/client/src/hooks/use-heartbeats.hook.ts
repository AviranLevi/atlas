// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HEARTBEAT_CONFIGS_KEY }),
  });
}

export function useUpdateHeartbeatConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHeartbeatConfig }) =>
      api.put<HeartbeatConfig>(`/heartbeats/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HEARTBEAT_CONFIGS_KEY }),
  });
}

export function useDeleteHeartbeatConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/heartbeats/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HEARTBEAT_CONFIGS_KEY }),
  });
}

export function useTriggerHeartbeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<HeartbeatRun>(`/heartbeats/${id}/trigger`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HEARTBEAT_CONFIGS_KEY });
      queryClient.invalidateQueries({ queryKey: HEARTBEAT_HISTORY_KEY });
    },
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
