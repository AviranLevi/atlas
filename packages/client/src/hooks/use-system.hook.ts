import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

type SystemInfo = {
  version: string;
  apiUrl: string;
  dbPath: string;
  dbSizeBytes: number;
  uptimeSeconds: number;
  nodeVersion: string;
};

const SYSTEM_KEY = ['system-info'] as const;

export function useSystemInfo() {
  return useQuery({
    queryKey: [...SYSTEM_KEY],
    queryFn: () => api.get<SystemInfo>('/system/info'),
    staleTime: 30_000,
  });
}

export function useResetAllData() {
  return useMutation({
    mutationFn: () => api.post<unknown>('/system/reset', {}),
  });
}
