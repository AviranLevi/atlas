// Components
import { AgentOutput } from '@/pages/workspaces/components/AgentOutput';

// Lib
import type { WorkspaceView } from '@/pages/workspaces/workspace-view';

// Types
import type { Workspace } from '@atlas/shared';

export type WorkspaceAgentOutputProps = {
  view: WorkspaceView;
  // `fullOutput` is a service-layer extension (workspace-query.service.ts)
  // not present on the shared schema; admit it explicitly here.
  workspace: Workspace & { fullOutput?: string };
  streamedLog: string | null;
};

export function WorkspaceAgentOutput({ view, workspace, streamedLog }: WorkspaceAgentOutputProps) {
  const mode = view.caps.agentOutput;
  if (mode === 'none') return null;
  if (mode === 'stream') {
    return <AgentOutput text={streamedLog ?? ''} isLive />;
  }
  const text = workspace.fullOutput ?? workspace.output ?? '';
  if (!text) return null;
  return <AgentOutput text={text} isLive={false} defaultCollapsed={mode === 'persisted-collapsed'} />;
}
