// Shared
import type { Skill } from '@atlas/shared';

export type SkillDetail = {
  skill: Skill;
  agents: { id: string; name: string }[];
};
