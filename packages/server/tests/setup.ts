import { beforeEach, vi } from 'vitest';

vi.mock('../src/lib/logger.js', async () => {
  const { mockLogger } = await import('./mocks/logger.mock.js');
  return { logger: mockLogger };
});

vi.mock('../src/lib/errors.js', async () => {
  const { MockAppError } = await import('./mocks/errors.mock.js');
  return { AppError: MockAppError };
});

beforeEach(() => {
  vi.clearAllMocks();
});
