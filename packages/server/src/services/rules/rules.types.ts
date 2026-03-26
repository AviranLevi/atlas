import type { Rule } from '@my-agents/shared';

export type RuleDetail = {
  rule: Rule;
  agents: { id: string; name: string }[];
};
