import type { Rule } from '@atlas/shared';

import { TS } from '../constants/timestamps.constants.js';

export function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 'rule-1',
    name: 'Test Rule',
    type: 'General',
    tags: ['ts'],
    content: 'Always use TypeScript',
    projectId: null,
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}
