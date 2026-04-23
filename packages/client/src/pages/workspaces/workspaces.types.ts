// Types
import type { Workspace } from '@atlas/shared';
import type { WorkspaceView } from './workspace-view';

export type StatusFilter =
  | 'all'
  | 'active'
  | 'awaitingApproval'
  | 'needsReview'
  | 'approved'
  | 'merged'
  | 'failed'
  | 'stopped';

export type StatusIconProps = {
  status: string;
  className?: string;
};

export type WorkspaceRowProps = {
  workspace: Workspace;
};

export type WorkspaceDetailHeaderProps = {
  workspace: Workspace;
  view: WorkspaceView;
  onStop: () => void;
  onRerun: () => void;
  onFollowUp: () => void;
  onCleanup: () => void;
  onOpenInEditor: () => void;
  isStopping: boolean;
  // `isRerunning` is always false at the current call site; retained so the
  // button can light up loading state when real rerun wiring is added in a
  // follow-up PR. Do not hard-delete until that work lands.
  isRerunning: boolean;
  isCleaning: boolean;
  isOpeningInEditor: boolean;
};

export type WorkspaceInfoCardsProps = {
  workspace: Workspace;
};

export type AgentOutputProps = {
  text: string;
  isLive?: boolean;
  title?: string;
  defaultCollapsed?: boolean;
};
