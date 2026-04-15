// Types
import type { Workspace } from '@atlas/shared';

export type StatusFilter = 'all' | 'active' | 'completed' | 'failed' | 'stopped' | 'merged';

export type StatusIconProps = {
  status: string;
  className?: string;
};

export type WorkspaceRowProps = {
  workspace: Workspace;
};

export type WorkspaceDetailHeaderProps = {
  workspace: Workspace;
  isActive: boolean;
  canReview: boolean;
  canRerun: boolean;
  canCleanup: boolean;
  onStop: () => void;
  onRerun: () => void;
  onFollowUp: () => void;
  onCleanup: () => void;
  onOpenInEditor: () => void;
  isStopping: boolean;
  isRerunning: boolean;
  isCleaning: boolean;
  isOpeningInEditor: boolean;
};

export type WorkspaceInfoCardsProps = {
  workspace: Workspace;
};

export type TerminalOutputProps = {
  text: string;
  isLive?: boolean;
  title?: string;
  defaultCollapsed?: boolean;
};
