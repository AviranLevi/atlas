import type { Agent } from '@my-agents/shared';

export type KanbanFilterBarProps = {
  agents: Agent[];
  agentFilter: string | undefined;
  onAgentFilterChange: (value: string | undefined) => void;
  onClearFilters: () => void;
};
