// React / library
import { useMutation, useQuery } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

type SystemInfo = {
  version: string;
  apiUrl: string;
  dbPath: string;
  dbSizeBytes: number;
  uptimeSeconds: number;
  nodeVersion: string;
};

export type UpdateCheckResult = {
  current: string;
  latest: string;
  hasUpdate: boolean;
  releaseUrl: string | null;
};

const SYSTEM_KEY = ['system-info'] as const;

export function useSystemInfo() {
  return useQuery({
    queryKey: [...SYSTEM_KEY],
    queryFn: () => api.get<SystemInfo>('/system/info'),
    staleTime: 30_000,
  });
}

export function useUpdateCheck() {
  return useMutation({
    mutationFn: () => api.get<UpdateCheckResult>('/system/update-check'),
  });
}

export function useResetAllData() {
  return useMutation({
    mutationFn: () => api.post<unknown>('/system/reset', {}),
  });
}
