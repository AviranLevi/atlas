// Hooks
import { useWorkspaces } from '@/hooks/use-workspaces.hook';

export function ActiveWorkspaceDot() {
  const { data: workspaces = [] } = useWorkspaces();
  const activeCount = workspaces.filter((w) => w.status === 'running' || w.status === 'pending').length;
  if (activeCount === 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">
      {activeCount}
    </span>
  );
}
