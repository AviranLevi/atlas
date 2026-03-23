import type { Agent, AgentProvider, ProviderType } from '@my-agents/shared';

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

export type EditableCardProps = {
  icon: React.ElementType;
  label: string;
  value: string | null;
  placeholder: string;
  onSave: (value: string | null) => void;
  isPending: boolean;
};
