// Hooks
import { useWorkspaces } from '@/hooks/use-workspaces.hook';

// Types
import type { ActiveWorkspaceDotProps } from './active-workspace-dot.types';

/** Renders a pulsing dot on a project tab when that project has running/pending workspaces. */
export function ActiveWorkspaceDot({ projectId }: ActiveWorkspaceDotProps) {
  const { data: workspaces = [] } = useWorkspaces();
  const hasActive = workspaces.some(
    (w) => w.projectId === projectId && (w.status === 'running' || w.status === 'pending'),
  );
  if (!hasActive) return null;
  return (
    <span className="absolute right-1 top-1 flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
    </span>
  );
}
