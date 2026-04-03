import { vi } from 'vitest';

export const mockAgentsService = {
  list: vi.fn(),
  getById: vi.fn(),
  getDetail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  attachSkill: vi.fn(),
  attachRule: vi.fn(),
};
