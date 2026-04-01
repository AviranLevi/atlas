// React / library
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Hooks
import { useWorkspaces } from '@/hooks/use-workspaces.hook';

// Constants
import { ACTIVE_STATUSES, WORKSPACE_TRANSITIONS } from '@/components/workspaces/workspaces.constants';

/**
 * Watches all workspace statuses and fires a toast whenever an active
 * workspace transitions to a terminal state (completed / merged / failed).
 * Must be mounted inside a BrowserRouter context.
 */
export function useWorkspaceNotifications() {
  const { data: workspaces } = useWorkspaces();
  const navigate = useNavigate();
  const prevRef = useRef<Record<string, string> | null>(null);

  useEffect(() => {
    if (!workspaces) return;

    const current: Record<string, string> = Object.fromEntries(workspaces.map((w) => [w.id, w.status]));

    if (prevRef.current === null) {
      // First load — capture state without notifying.
      prevRef.current = current;
      return;
    }

    for (const w of workspaces) {
      const prevStatus = prevRef.current[w.id];
      const transition = WORKSPACE_TRANSITIONS[w.status];

      if (prevStatus && ACTIVE_STATUSES.has(prevStatus) && transition) {
        const label = w.taskName ?? 'Task';
        const url = `/workspaces/${w.id}`;

        if (transition.kind === 'success') {
          toast.success(`${label} ${transition.verb}`, {
            action: { label: 'View', onClick: () => navigate(url) },
          });
        } else {
          toast.error(`${label} ${transition.verb}`, {
            action: { label: 'View', onClick: () => navigate(url) },
          });
        }
      }
    }

    prevRef.current = current;
  }, [workspaces, navigate]);
}
