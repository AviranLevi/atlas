import type { Skill } from '@atlas/shared';

import { TS } from '../constants/timestamps.constants.js';

export function makeSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    id: 'skill-1',
    name: 'Test Skill',
    type: 'Coding',
    steps: 'step 1\nstep 2',
    inputFormat: 'markdown',
    outputFormat: 'code',
    projectId: null,
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}
