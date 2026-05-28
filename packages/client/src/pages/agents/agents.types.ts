// Types
import type { Agent, AgentProvider } from '@atlas/shared';

export type ProvidersSectionProps = {
  providers: AgentProvider[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onEdit: (provider: AgentProvider) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
};

export type AgentsSectionProps = {
  agents: Agent[] | undefined;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onCreate: () => void;
  onImport: () => void;
  onEdit: (e: React.MouseEvent, agent: Agent) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onNavigate: (id: string) => void;
};
