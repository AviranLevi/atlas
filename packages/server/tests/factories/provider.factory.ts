import type { AgentProvider } from '@atlas/shared';

import { TS } from '../constants/timestamps.constants.js';

export function makeProvider(overrides: Partial<AgentProvider> = {}): AgentProvider {
  return {
    id: 'prov-1',
    name: 'My Anthropic',
    type: 'anthropic',
    apiKey: 'sk-xxx',
    baseUrl: null,
    modelName: 'claude-sonnet-4-20250514',
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}
