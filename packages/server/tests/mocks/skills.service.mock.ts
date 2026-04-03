import { vi } from 'vitest';

export const mockSkillsService = {
  list: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};
