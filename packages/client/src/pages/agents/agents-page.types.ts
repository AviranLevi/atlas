import type { Agent, AgentProvider } from '@my-agents/shared';

export type ProvidersSectionProps = {
  providers: AgentProvider[];
  isLoading: boolean;
  onEdit: (provider: AgentProvider) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
};

export type AgentsSectionProps = {
  agents: Agent[] | undefined;
  isLoading: boolean;
  onCreate: () => void;
  onEdit: (e: React.MouseEvent, agent: Agent) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onNavigate: (id: string) => void;
};
