import type { Phase } from '@my-agents/shared';

export type PhaseCardProps = {
  phase: Phase;
  onEdit: (phase: Phase) => void;
  onDelete: (id: string) => void;
};

export type PhaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  phase?: Phase;
};
