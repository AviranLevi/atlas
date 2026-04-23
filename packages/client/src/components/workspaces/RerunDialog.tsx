// React / library
import { AlertTriangle, Cpu, RotateCcw, Server, Wand2 } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Hooks
import { useAgentProviders } from '@/hooks/use-agent-providers.hook';
import { useAgent } from '@/hooks/use-agents.hook';
import { useTask } from '@/hooks/use-tasks.hook';
import { useAgentRuntimes, useRerunWorkspace } from '@/hooks/use-workspaces.hook';

// Types
import type { RerunDialogProps } from './workspaces.types';

/**
 * Re-run a workspace with the exact same runtime, model, and provider that
 * the original run used. No overrides — provider is pinned via
 * `task.workflowProviderId`, runtime and model come from the prior workspace
 * row, and the backend POST body is empty.
 */
export function RerunDialog({ open, onOpenChange, workspace, onSuccess }: RerunDialogProps) {
  const rerun = useRerunWorkspace();
  const { data: runtimes = [] } = useAgentRuntimes();
  const { data: task } = useTask(workspace.taskId);
  const { data: agent } = useAgent(workspace.agentId ?? undefined);
  const { data: providers = [] } = useAgentProviders();

  const runtime = runtimes.find((r) => r.id === workspace.agentRuntime);
  const pinnedProviderId = task?.workflowProviderId ?? agent?.providerId ?? null;
  const provider = pinnedProviderId ? providers.find((p) => p.id === pinnedProviderId) : null;

  const runtimeLabel = runtime?.name ?? workspace.agentRuntime;
  const modelLabel = workspace.model ?? 'default';
  const providerLabel = provider ? provider.name : 'CLI only';

  const isStructuredStage = workspace.workflowStage === 'brainstorm' || workspace.workflowStage === 'plan';
  const hadFallback = !!workspace.providerFallbackReason;

  const handleRerun = () => {
    rerun.mutate(workspace.id, {
      onSuccess: (newWorkspace) => {
        onOpenChange(false);
        onSuccess?.(newWorkspace);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Re-run workspace
          </DialogTitle>
          <DialogDescription>
            This will clean up the existing workspace and start a fresh run with the same settings. Same task, same
            branch, same runtime, same model, same provider.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <dl className="space-y-2 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm">
            <SummaryRow icon={<Server className="h-3.5 w-3.5" />} label="Runtime" value={runtimeLabel} />
            <SummaryRow icon={<Cpu className="h-3.5 w-3.5" />} label="Model" value={modelLabel} />
            <SummaryRow icon={<Wand2 className="h-3.5 w-3.5" />} label="Provider" value={providerLabel} />
          </dl>

          {hadFallback && isStructuredStage && (
            <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span className="text-muted-foreground">
                The previous run fell back to CLI execution ({workspace.providerFallbackReason}). The re-run will do the
                same unless you attach an API provider to the agent.
              </span>
            </div>
          )}

          {rerun.isError && <p className="text-destructive text-sm">{(rerun.error as Error).message}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleRerun} disabled={rerun.isPending}>
              {rerun.isPending ? 'Starting...' : 'Re-run'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="font-medium text-foreground truncate" title={value}>
        {value}
      </dd>
    </div>
  );
}
