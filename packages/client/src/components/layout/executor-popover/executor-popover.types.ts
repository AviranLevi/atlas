// Types
import type { ExecutorStatus } from '@atlas/shared';

export type ExecutorPopoverProps = {
  executor: ExecutorStatus;
  onRecheck: () => void;
  isRechecking: boolean;
};

export type CopyCommandProps = {
  label: string;
  command: string;
};
