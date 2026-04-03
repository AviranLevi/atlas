import { vi } from 'vitest';

export const mockRulesService = {
  list: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};
