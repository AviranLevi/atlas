// React / library
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Subscribes to the server's SSE change stream (`GET /api/v1/events`) and
 * invalidates the matching React Query caches when something changes — so the
 * UI updates live instead of relying solely on interval polling.
 *
 * Invalidation-only: events carry no data, just an entity kind. The actual
 * data is refetched through the normal authed REST path. EventSource
 * auto-reconnects on drop, so this needs no manual retry logic.
 *
 * Mount once near the app root (inside QueryClientProvider).
 */
export function useEventStream(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const es = new EventSource('/api/v1/events');

    const invalidate = (keys: readonly (readonly unknown[])[]) => {
      for (const queryKey of keys) {
        queryClient.invalidateQueries({ queryKey });
      }
    };

    // A workspace transition cascades: its own status, the task status that
    // mirrors it, any review created on completion, and pipeline advancement.
    es.addEventListener('workspace', () => {
      invalidate([['workspaces'], ['tasks'], ['reviews'], ['pipelines']]);
    });

    // Reserved for when the server starts emitting these kinds directly.
    es.addEventListener('task', () => invalidate([['tasks']]));
    es.addEventListener('review', () => invalidate([['reviews']]));
    es.addEventListener('pipeline', () => invalidate([['pipelines']]));

    return () => es.close();
  }, [queryClient]);
}
