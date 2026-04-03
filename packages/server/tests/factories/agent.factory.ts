import type { Agent } from '@atlas/shared';

import { TS } from '../constants/timestamps.constants.js';

export function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 'agent-1',
    name: 'Test Agent',
    description: 'desc',
    personality: 'friendly',
    unbreakableRules: 'be safe',
    providerId: 'prov-1',
    defaultModel: 'claude-sonnet',
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}
