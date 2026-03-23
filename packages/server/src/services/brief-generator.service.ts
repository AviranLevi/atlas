// Shared
import type { Project, ProjectScanData, Memory } from '@my-agents/shared';

// Services
import { memoryService, projectsService } from './index.js';

// Lib
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';

const FILE_PATH = 'services/brief-generator.service.ts';

/**
 * Max number of memories to include inline in the brief.
 * The rest are available via MCP `list_memories` tool.
 */
const MAX_INLINE_MEMORIES = 15;

/**
 * Generates a compact, structured project brief from scan data + memories.
 * Designed to be ~300-600 tokens — enough for an agent to understand the
 * project without needing to scan the codebase from scratch.
 */
export class BriefGeneratorService {
  /**
   * Generate and persist the brief for a project.
   */
  async generateAndSave(projectId: string): Promise<string> {
    const FUNCTION_NAME = 'generateAndSave';
    try {
      const project = await projectsService.getById(projectId);
      const memories = await memoryService.listByProject(projectId);
      const brief = this.generate(project, memories);

      await projectsService.update(projectId, { projectBrief: brief });
      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - generated brief for project ${projectId} (${brief.length} chars)`);
      return brief;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to generate brief', { cause: error });
    }
  }

  /**
   * Generate the brief string (pure function, no side effects).
   */
  generate(project: Project, memories: Memory[]): string {
    const lines: string[] = [];
    const sd = project.scanData;

    // ─── Header ──────────────────────────────────────────────────
    lines.push(`# ${project.name}`);

    const meta: string[] = [];
    if (sd?.projectType) meta.push(sd.projectType);
    if (sd?.languages?.length) meta.push(sd.languages.join(', '));
    if (sd?.packageManager) meta.push(sd.packageManager);
    if (project.defaultBranch) meta.push(`branch: ${project.defaultBranch}`);
    if (sd?.monorepo) meta.push('monorepo');
    if (meta.length) lines.push(meta.join(' | '));

    if (project.description) lines.push(`\n${project.description}`);

    // ─── Structure ───────────────────────────────────────────────
    if (sd?.keyDirectories && Object.keys(sd.keyDirectories).length > 0) {
      lines.push('\n## Structure');
      for (const [label, dir] of Object.entries(sd.keyDirectories)) {
        lines.push(`- **${label}**: \`${dir}\``);
      }
    }

    // ─── Scripts ─────────────────────────────────────────────────
    if (sd?.scripts && Object.keys(sd.scripts).length > 0) {
      lines.push('\n## Scripts');
      for (const [name, cmd] of Object.entries(sd.scripts)) {
        lines.push(`- \`${name}\`: \`${cmd}\``);
      }
    }

    // ─── Environment ─────────────────────────────────────────────
    const hasEnv = (sd?.envVars?.length ?? 0) > 0;
    const hasPorts = (sd?.ports?.length ?? 0) > 0;
    if (hasEnv || hasPorts) {
      lines.push('\n## Environment');
      if (sd?.ports?.length) lines.push(`- Ports: ${sd.ports.join(', ')}`);
      if (sd?.envVars?.length) lines.push(`- Required env vars: ${sd.envVars.join(', ')}`);
    }

    // ─── Formatting ──────────────────────────────────────────────
    if (sd?.formatting) {
      const tools: string[] = [];
      if (sd.formatting.prettier) tools.push('Prettier');
      if (sd.formatting.eslint) tools.push('ESLint');
      if (sd.formatting.biome) tools.push('Biome');
      if (sd.formatting.editorconfig) tools.push('EditorConfig');
      if (tools.length > 0) {
        lines.push(`\n## Formatting`);
        lines.push(tools.join(', '));
        if (sd.formatting.config?.prettier) {
          const pc = sd.formatting.config.prettier as Record<string, unknown>;
          const settings: string[] = [];
          if (pc.singleQuote !== undefined) settings.push(`singleQuote: ${pc.singleQuote}`);
          if (pc.semi !== undefined) settings.push(`semi: ${pc.semi}`);
          if (pc.tabWidth !== undefined) settings.push(`tabWidth: ${pc.tabWidth}`);
          if (pc.printWidth !== undefined) settings.push(`printWidth: ${pc.printWidth}`);
          if (pc.trailingComma !== undefined) settings.push(`trailingComma: ${pc.trailingComma}`);
          if (settings.length) lines.push(`Prettier config: ${settings.join(', ')}`);
        }
      }
    }

    // ─── Memories (grouped by type, condensed) ───────────────────
    if (memories.length > 0) {
      // Sort by most recently updated, then take top N
      const sorted = [...memories].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      const selected = sorted.slice(0, MAX_INLINE_MEMORIES);
      const overflow = memories.length - selected.length;

      // Group by type
      const byType = new Map<string, Memory[]>();
      for (const m of selected) {
        const list = byType.get(m.type) ?? [];
        list.push(m);
        byType.set(m.type, list);
      }

      lines.push('\n## Project Knowledge');

      const typeOrder = ['Convention', 'Decision', 'Problem', 'Preference'];
      for (const type of typeOrder) {
        const items = byType.get(type);
        if (!items?.length) continue;
        lines.push(`\n### ${type}s`);
        for (const m of items) {
          // Truncate long content to keep brief compact
          const content = m.content.length > 150
            ? m.content.slice(0, 147) + '...'
            : m.content;
          lines.push(`- **${m.name}**: ${content}`);
        }
      }

      if (overflow > 0) {
        lines.push(`\n_${overflow} more memories available via \`list_memories\` MCP tool._`);
      }
    }

    // ─── Dependencies (condensed) ────────────────────────────────
    if (sd?.dependencies?.length) {
      lines.push('\n## Key Dependencies');
      // Show only the most important ones (frameworks, ORMs, etc.)
      const important = sd.dependencies.filter((d) =>
        [
          'react', 'vue', 'svelte', 'angular', 'next', 'nuxt', 'solid-js',
          'express', 'fastify', 'hono', 'koa', 'nestjs', '@nestjs/core',
          'drizzle-orm', 'prisma', '@prisma/client', 'typeorm', 'sequelize', 'mongoose',
          'tailwindcss', 'vite', 'webpack', 'esbuild', 'rollup',
          'electron', 'react-native', 'expo',
          'zod', 'joi', 'yup',
          'jest', 'vitest', 'mocha', 'playwright', 'cypress',
          'better-sqlite3', 'pg', 'postgres', 'mongodb', 'redis', 'ioredis',
          'axios', 'trpc', '@tanstack/react-query',
        ].includes(d)
      );
      if (important.length) {
        lines.push(important.join(', '));
      }
      const remaining = sd.dependencies.length - important.length;
      if (remaining > 0) {
        lines.push(`_+ ${remaining} other dependencies_`);
      }
    }

    return lines.join('\n');
  }
}
