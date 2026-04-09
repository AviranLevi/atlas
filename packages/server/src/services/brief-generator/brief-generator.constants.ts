/**
 * Max number of memories to include inline in the brief.
 * The rest are available via MCP `list_memories` tool.
 */
export const MAX_INLINE_MEMORIES = 15;

/** Max characters per memory line in the brief (including ellipsis when truncated). */
export const BRIEF_MEMORY_CONTENT_PREVIEW_MAX = 150;

export const BRIEF_MEMORY_TRUNCATION_ELLIPSIS = '...';

export const BRIEF_MEMORY_CONTENT_SLICE_LENGTH =
  BRIEF_MEMORY_CONTENT_PREVIEW_MAX - BRIEF_MEMORY_TRUNCATION_ELLIPSIS.length;

/**
 * Order of memory subsections under "Project Knowledge" in generated briefs.
 * Types not listed here are omitted from that section.
 */
export const MEMORY_TYPE_ORDER = ['Convention', 'Decision', 'Problem', 'Preference'] as const;

/** Package names (exact match) surfaced in the brief under Key Dependencies. */
export const IMPORTANT_DEPENDENCY_PACKAGES: readonly string[] = [
  'react',
  'vue',
  'svelte',
  'angular',
  'next',
  'nuxt',
  'solid-js',
  'express',
  'fastify',
  'hono',
  'koa',
  'nestjs',
  '@nestjs/core',
  'drizzle-orm',
  'prisma',
  '@prisma/client',
  'typeorm',
  'sequelize',
  'mongoose',
  'tailwindcss',
  'vite',
  'webpack',
  'esbuild',
  'rollup',
  'electron',
  'react-native',
  'expo',
  'zod',
  'joi',
  'yup',
  'jest',
  'vitest',
  'mocha',
  'playwright',
  'cypress',
  'better-sqlite3',
  'pg',
  'postgres',
  'mongodb',
  'redis',
  'ioredis',
  'axios',
  'trpc',
  '@tanstack/react-query',
];

export const IMPORTANT_DEPENDENCY_NAME_SET = new Set<string>(IMPORTANT_DEPENDENCY_PACKAGES);
