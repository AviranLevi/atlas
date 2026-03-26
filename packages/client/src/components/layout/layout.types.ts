import type { ExecutorStatus } from '@atlas/shared';

export type NavItem = {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: boolean;
};

export type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export type AgentStatusPanelProps = {
  expanded: boolean;
};

export type ExecutorPopoverProps = {
  executor: ExecutorStatus;
  onRecheck: () => void;
  isRechecking: boolean;
};

export type CopyCommandProps = {
  label: string;
  command: string;
};

export type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  color: string | null;
  label: string;
  icon?: React.ReactNode;
};
