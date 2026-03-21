import type { Agent, AgentProvider, ProviderType } from '@my-agents/shared';

export type AgentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent;
};

export type AgentProviderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: AgentProvider;
};

export type ProviderBadgeProps = {
  type: ProviderType;
};
