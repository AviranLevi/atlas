import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema/*.schema.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: '../../data/agents.db',
  },
});
