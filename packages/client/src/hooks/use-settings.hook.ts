import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  GlobalInstructions,
  UpdateGlobalInstructions,
  DispatchRule,
  CreateDispatchRule,
  UpdateDispatchRule,
} from '@my-agents/shared';
import type { ConnectionInfo } from '@/components/settings/settings.types';

const GLOBAL_INSTRUCTIONS_KEY = ['settings', 'global-instructions'] as const;
const DISPATCH_RULES_KEY = ['settings', 'dispatch-rules'] as const;
const MCP_CONNECTION_KEY = ['mcp-connection-info'] as const;

export function useGlobalInstructions() {
  return useQuery({
    queryKey: GLOBAL_INSTRUCTIONS_KEY,
    queryFn: () =>
      api.get<GlobalInstructions>('/settings/global-instructions'),
  });
}

export function useUpdateGlobalInstructions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateGlobalInstructions) =>
      api.put<GlobalInstructions>('/settings/global-instructions', data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: GLOBAL_INSTRUCTIONS_KEY }),
  });
}

export function useDispatchRules() {
  return useQuery({
    queryKey: DISPATCH_RULES_KEY,
    queryFn: () => api.get<DispatchRule[]>('/settings/dispatch-rules'),
  });
}

export function useCreateDispatchRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDispatchRule) =>
      api.post<DispatchRule>('/settings/dispatch-rules', data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: DISPATCH_RULES_KEY }),
  });
}

export function useUpdateDispatchRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateDispatchRule;
    }) =>
      api.put<DispatchRule>(`/settings/dispatch-rules/${id}`, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: DISPATCH_RULES_KEY }),
  });
}

export function useDeleteDispatchRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/settings/dispatch-rules/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: DISPATCH_RULES_KEY }),
  });
}

/** Returns MCP connection info (SSE URL, config snippets for Cursor/Claude). */
export function useMcpConnectionInfo() {
  return useQuery({
    queryKey: MCP_CONNECTION_KEY,
    queryFn: () => api.get<ConnectionInfo>('/mcp/connection-info'),
  });
}
