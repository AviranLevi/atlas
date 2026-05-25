// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Lib
import { api } from '@/lib/api';

// Types
import type { SystemInfo, UpdateCheckResult, UpdateProgress } from '@atlas/shared';

const SYSTEM_KEY = ['system-info'] as const;
const UPDATE_CHECK_KEY = ['update-check'] as const;
const UPDATE_PROGRESS_KEY = ['update-progress'] as const;

/** Returns server metadata and database file stats. */
export function useSystemInfo() {
  return useQuery({
    queryKey: [...SYSTEM_KEY],
    queryFn: () => api.get<SystemInfo>('/system/info'),
    staleTime: 30_000,
  });
}

/** Checks GitHub for newer version. Auto-fetches, cached 1 hour. */
export function useUpdateCheck() {
  return useQuery({
    queryKey: [...UPDATE_CHECK_KEY],
    queryFn: () => api.get<UpdateCheckResult>('/system/update-check'),
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });
}

/** Triggers server self-update. Returns 202 immediately. */
export function useTriggerUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ status: string; startedAt: string }>('/system/update', {}),
    onSuccess: () => {
      toast.success('Update started');
      qc.invalidateQueries({ queryKey: UPDATE_PROGRESS_KEY });
    },
    onError: (e) => toast.error(`Failed to start update: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}

/** Polls update progress while status is 'updating'. */
export function useUpdateProgress(enabled: boolean) {
  return useQuery({
    queryKey: [...UPDATE_PROGRESS_KEY],
    queryFn: () => api.get<UpdateProgress>('/system/update-progress'),
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'updating') return 2_000;
      return false;
    },
    retry: false,
  });
}

/**
 * Polls server health after update completes or server goes down.
 * Returns `true` once server responds, `false` while unreachable.
 */
export function useServerHealthPoll(enabled: boolean) {
  const [healthy, setHealthy] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qc = useQueryClient();

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      setHealthy(false);
      return;
    }

    intervalRef.current = setInterval(async () => {
      try {
        await api.get<SystemInfo>('/system/info');
        setHealthy(true);
        stop();
        // Refresh all cached data — server restarted with new code
        qc.invalidateQueries();
      } catch {
        // Server still down, keep polling
      }
    }, 3_000);

    return stop;
  }, [enabled, stop, qc]);

  return healthy;
}

/** Resets all application data. Requires confirm: true. */
export function useResetAllData() {
  return useMutation({
    mutationFn: () => api.post<unknown>('/system/reset', { confirm: true }),
    onSuccess: () => toast.success('All data has been reset'),
    onError: (e) => toast.error(`Failed to reset data: ${e instanceof Error ? e.message : 'Unknown error'}`),
  });
}
