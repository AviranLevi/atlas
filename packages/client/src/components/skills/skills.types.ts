import type { Skill } from '@atlas/shared';

export type SkillDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (skill: Skill) => void;
};
