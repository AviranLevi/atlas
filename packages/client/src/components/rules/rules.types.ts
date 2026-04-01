// Types
import type { Rule } from '@atlas/shared';

export type RuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (rule: Rule) => void;
};
