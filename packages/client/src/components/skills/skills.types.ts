import type { Skill } from '@my-agents/shared';

export type SkillDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill?: Skill;
};
