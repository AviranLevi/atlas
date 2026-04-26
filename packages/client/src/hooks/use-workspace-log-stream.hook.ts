// React / library
import { useEffect, useRef, useState } from 'react';

/**
 * Streams live log output from a running workspace via SSE.
 * Returns the accumulated log text while active; null when idle.
 */
export function useWorkspaceLogStream(workspaceId: string | undefined, isActive: boolean) {
  const [log, setLog] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!workspaceId || !isActive) {
      setLog(null);
      return;
    }

    setLog('');
    const es = new EventSource(`/api/v1/workspaces/${workspaceId}/logs/stream`);
    esRef.current = es;

    es.addEventListener('log', (e) => {
      try {
        const chunk = JSON.parse((e as MessageEvent).data) as string;
        setLog((prev) => (prev ?? '') + chunk);
      } catch {
        setLog((prev) => (prev ?? '') + (e as MessageEvent).data);
      }
    });

    es.addEventListener('done', () => {
      es.close();
      esRef.current = null;
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [workspaceId, isActive]);

  return log;
}
