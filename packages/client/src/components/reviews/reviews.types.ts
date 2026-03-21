import type { ReviewStatus } from '@my-agents/shared';

export type ReviewBadgeProps = {
  status: ReviewStatus;
};

export type ReviewPanelProps = {
  taskId: string;
};
