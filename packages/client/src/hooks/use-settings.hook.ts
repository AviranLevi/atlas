// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Lib
import { api } from '@/lib/api';

// Types
import type {
  CreateDispatchRule,
  DispatchRule,
  GlobalInstructions,
  McpConnectionInfo,
  UpdateDispatchRule,
  UpdateGlobalInstructions,
} from '@atlas/shared';

const GLOBAL_INSTRUCTIONS_KEY = ['settings', 'global-instructions'] as const;
const DISPATCH_RULES_KEY = ['settings', 'dispatch-rules'] as const;
const MCP_CONNECTION_KEY = ['mcp-connection-info'] as const;

export function useGlobalInstructions() {
  return useQuery({
    queryKey: GLOBAL_INSTRUCTIONS_KEY,
    queryFn: () => api.get<GlobalInstructions>('/settings/global-instructions/current'),
  });
}

export function useUpdateGlobalInstructions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateGlobalInstructions) =>
      api.put<GlobalInstructions>('/settings/global-instructions/current', data),
    onSuccess: () => {
      toast.success('Global instructions saved');
      queryClient.invalidateQueries({ queryKey: GLOBAL_INSTRUCTIONS_KEY });
    },
    onError: (e) =>
      toast.error(`Failed to save global instructions: ${e instanceof Error ? e.message : 'Unknown error'}`),
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
    mutationFn: (data: CreateDispatchRule) => api.post<DispatchRule>('/settings/dispatch-rules', data),
    onSuccess: () => {
      toast.success('Dispatch rule created');
      queryClient.invalidateQueries({ queryKey: DISPATCH_RULES_KEY });
    },
    onError: (e) => toast.error(`Failed to create dispatch rule: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useUpdateDispatchRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDispatchRule }) =>
      api.put<DispatchRule>(`/settings/dispatch-rules/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DISPATCH_RULES_KEY }),
    onError: (e) => toast.error(`Failed to update dispatch rule: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

export function useDeleteDispatchRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/settings/dispatch-rules/${id}`),
    onSuccess: () => {
      toast.success('Dispatch rule deleted');
      queryClient.invalidateQueries({ queryKey: DISPATCH_RULES_KEY });
    },
    onError: (e) => toast.error(`Failed to delete dispatch rule: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

/** Returns MCP connection info (SSE URL, config snippets for Cursor/Claude). */
export function useMcpConnectionInfo() {
  return useQuery({
    queryKey: MCP_CONNECTION_KEY,
    queryFn: () => api.get<McpConnectionInfo>('/mcp/connection-info'),
  });
}
