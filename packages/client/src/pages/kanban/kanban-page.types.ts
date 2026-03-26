import type { Agent } from '@atlas/shared';

export type KanbanFilterBarProps = {
  agents: Agent[];
  agentFilter: string | undefined;
  onAgentFilterChange: (value: string | undefined) => void;
  onClearFilters: () => void;
};
