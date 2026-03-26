import type { Skill } from '@my-agents/shared';

export type SkillDetail = {
  skill: Skill;
  agents: { id: string; name: string }[];
};
