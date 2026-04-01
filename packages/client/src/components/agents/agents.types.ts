// Types
import type { Agent, AgentProvider, ProviderType } from '@atlas/shared';

export type AgentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent;
  onCreated?: (agent: Agent) => void;
};

export type AgentProviderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: AgentProvider;
};

export type ProviderBadgeProps = {
  type: ProviderType;
};
