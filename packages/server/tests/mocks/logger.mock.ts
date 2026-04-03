import { vi } from 'vitest';

export const mockLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};
