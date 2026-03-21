import type { Memory } from '@my-agents/shared';

export type MemoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memory?: Memory;
};
