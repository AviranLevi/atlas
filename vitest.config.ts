import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['packages/*/tests/**/*.test.ts', 'packages/*/tests/**/*.spec.ts'],
    setupFiles: ['./packages/server/tests/setup.ts'],
  },
});
