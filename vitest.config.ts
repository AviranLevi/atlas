import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Mirror the client's `@/*` → `packages/client/src/*` alias (defined in
      // `packages/client/vite.config.ts` and `packages/client/tsconfig.json`)
      // so client tests run under root-level vitest can resolve the same
      // imports the app uses at runtime.
      '@': path.resolve(here, 'packages/client/src'),
    },
  },
  test: {
    globals: true,
    include: ['packages/*/tests/**/*.test.ts', 'packages/*/tests/**/*.spec.ts'],
    setupFiles: ['./packages/server/tests/setup.ts'],
  },
});
