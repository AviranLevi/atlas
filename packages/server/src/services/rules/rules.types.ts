// Shared
import type { Rule } from '@atlas/shared';

export type RuleDetail = {
  rule: Rule;
  agents: { id: string; name: string }[];
};
