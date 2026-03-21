import type { Rule } from '@my-agents/shared';

export type RuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: Rule;
};
