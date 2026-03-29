// Hooks
import { useWorkspaceNotifications } from '@/hooks/use-workspace-notifications.hook';

/** Mounts workspace status-change notifications. Renders nothing. */
export function WorkspaceNotifications() {
  useWorkspaceNotifications();
  return null;
}
