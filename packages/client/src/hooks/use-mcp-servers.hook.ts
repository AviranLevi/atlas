// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { CreateMcpServer, McpServer, UpdateMcpServer } from '@atlas/shared';

const MCP_SERVERS_KEY = ['mcp-servers'] as const;

export function useMcpServers() {
  return useQuery({
    queryKey: MCP_SERVERS_KEY,
    queryFn: () => api.get<McpServer[]>('/mcp-servers'),
  });
}

export function useCreateMcpServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMcpServer) => api.post<McpServer>('/mcp-servers', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MCP_SERVERS_KEY }),
  });
}

export function useUpdateMcpServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMcpServer }) => api.put<McpServer>(`/mcp-servers/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MCP_SERVERS_KEY }),
  });
}

export function useDeleteMcpServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/mcp-servers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MCP_SERVERS_KEY }),
  });
}
