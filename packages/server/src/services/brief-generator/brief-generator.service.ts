// Shared
import type { Memory, Project } from '@atlas/shared';

// Services
import { memoryService, projectsService } from '../index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

// Constants
import {
  BRIEF_MEMORY_CONTENT_PREVIEW_MAX,
  BRIEF_MEMORY_CONTENT_SLICE_LENGTH,
  BRIEF_MEMORY_TRUNCATION_ELLIPSIS,
  IMPORTANT_DEPENDENCY_NAME_SET,
  MAX_INLINE_MEMORIES,
  MEMORY_TYPE_ORDER,
} from './brief-generator.constants.js';

// Types
import type { BriefProjectScanData } from './brief-generator.types.js';

const FILE_PATH = 'services/brief-generator/brief-generator.service.ts';

/**
 * Generates a compact, structured project brief from scan data + memories.
 * Designed to be ~300-600 tokens — enough for an agent to understand the
 * project without needing to scan the codebase from scratch.
 *
 * Flow: load project + memories → concatenate markdown sections (each helper returns line arrays) → join with newlines → persist on `generateAndSave`.
 */
export class BriefGeneratorService {
  /**
   * Loads the project, builds the brief markdown, writes `projectBrief` on the project row, and returns the string.
   */
  async generateAndSave(projectId: string): Promise<string> {
    const FUNCTION_NAME = 'generateAndSave';
    try {
      const project = await projectsService.getById(projectId);
      const memories = await memoryService.listByProject(projectId);
      const brief = this.generate(project, memories);

      await projectsService.update(projectId, { projectBrief: brief });
      logger.info(
        `${FILE_PATH} :: ${FUNCTION_NAME} - generated brief for project ${projectId} (${brief.length} chars)`,
      );
      return brief;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to generate brief', { cause: error });
    }
  }

  /**
   * Builds the full brief as markdown. Does not touch the database — safe to call from tests or previews.
   */
  generate(project: Project, memories: Memory[]): string {
    const sd = project.scanData;
    // Order matches the intended reading flow: identity → layout → how to run → tooling → knowledge → stack signal.
    const lines: string[] = [
      ...this.buildTitleAndMetaLines(project),
      ...this.buildSubProjectsLines(sd),
      ...this.buildStructureLines(sd),
      ...this.buildScriptsLines(sd),
      ...this.buildEnvironmentLines(sd),
      ...this.buildFormattingLines(sd),
      ...this.buildMemoriesLines(memories),
      ...this.buildDependenciesLines(sd),
    ];
    return lines.join('\n');
  }

  /** H1 title, one-line scan summary (type, languages, package manager, branch, monorepo flag), then optional description. */
  private buildTitleAndMetaLines(project: Project): string[] {
    const sd = project.scanData;
    const lines: string[] = [`# ${project.name}`];

    const meta: string[] = [];
    if (sd?.projectType) meta.push(sd.projectType);
    if (sd?.languages?.length) meta.push(sd.languages.join(', '));
    if (sd?.packageManager) meta.push(sd.packageManager);
    if (project.defaultBranch) meta.push(`branch: ${project.defaultBranch}`);
    if (sd?.monorepo) meta.push('monorepo');
    if (meta.length) lines.push(meta.join(' | '));

    if (project.description) lines.push(`\n${project.description}`);

    return lines;
  }

  /** Sub-projects discovered in the repo (monorepo children). */
  private buildSubProjectsLines(sd: BriefProjectScanData): string[] {
    if (!sd?.subProjects?.length) return [];
    const lines: string[] = ['\n## Sub-Projects'];
    for (const sp of sd.subProjects) {
      const parts: string[] = [];
      if (sp.projectType) parts.push(sp.projectType);
      if (sp.languages?.length) parts.push(sp.languages.join(', '));
      if (sp.packageManager) parts.push(sp.packageManager);
      lines.push(`- **${sp.name}** (\`${sp.path}/\`): ${parts.join(' | ')}`);
    }
    return lines;
  }

  /** Maps labeled paths from the repo scanner (e.g. src, packages/client) into a bullet list. */
  private buildStructureLines(sd: BriefProjectScanData): string[] {
    if (!sd?.keyDirectories || Object.keys(sd.keyDirectories).length === 0) return [];
    const lines: string[] = ['\n## Structure'];
    for (const [label, dir] of Object.entries(sd.keyDirectories)) {
      lines.push(`- **${label}**: \`${dir}\``);
    }
    return lines;
  }

  /** npm/pnpm scripts discovered from package.json, name → command. */
  private buildScriptsLines(sd: BriefProjectScanData): string[] {
    if (!sd?.scripts || Object.keys(sd.scripts).length === 0) return [];
    const lines: string[] = ['\n## Scripts'];
    for (const [name, cmd] of Object.entries(sd.scripts)) {
      lines.push(`- \`${name}\`: \`${cmd}\``);
    }
    return lines;
  }

  /** Ports and required env var names from scan (values are never embedded). */
  private buildEnvironmentLines(sd: BriefProjectScanData): string[] {
    const hasEnv = (sd?.envVars?.length ?? 0) > 0;
    const hasPorts = (sd?.ports?.length ?? 0) > 0;
    if (!hasEnv && !hasPorts) return [];

    const lines: string[] = ['\n## Environment'];
    if (sd?.ports?.length) lines.push(`- Ports: ${sd.ports.join(', ')}`);
    if (sd?.envVars?.length) lines.push(`- Required env vars: ${sd.envVars.join(', ')}`);
    return lines;
  }

  /** Which formatters/linters exist plus a short Prettier option summary when config was parsed. */
  private buildFormattingLines(sd: BriefProjectScanData): string[] {
    if (!sd?.formatting) return [];

    const tools: string[] = [];
    if (sd.formatting.prettier) tools.push('Prettier');
    if (sd.formatting.eslint) tools.push('ESLint');
    if (sd.formatting.biome) tools.push('Biome');
    if (sd.formatting.editorconfig) tools.push('EditorConfig');
    if (tools.length === 0) return [];

    const lines: string[] = ['\n## Formatting', tools.join(', ')];

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

    return lines;
  }

  /**
   * Recent memories only (cap in constants), grouped under fixed subsection headings.
   * Types outside `MEMORY_TYPE_ORDER` are omitted here; overflow points agents to MCP `list_memories`.
   */
  private buildMemoriesLines(memories: Memory[]): string[] {
    if (memories.length === 0) return [];

    const sorted = [...memories].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const selected = sorted.slice(0, MAX_INLINE_MEMORIES);
    const overflow = memories.length - selected.length;

    const byType = new Map<string, Memory[]>();
    for (const m of selected) {
      const key = m.type ?? 'Other';
      const list = byType.get(key) ?? [];
      list.push(m);
      byType.set(key, list);
    }

    const lines: string[] = ['\n## Project Knowledge'];

    // Subsections appear in a stable order (Convention, Decision, …) so the brief is skimmable.
    for (const type of MEMORY_TYPE_ORDER) {
      const items = byType.get(type);
      if (!items?.length) continue;
      lines.push(`\n### ${type}s`);
      for (const m of items) {
        // Keep each bullet short so the brief stays within the target token budget.
        const content =
          m.content.length > BRIEF_MEMORY_CONTENT_PREVIEW_MAX
            ? `${m.content.slice(0, BRIEF_MEMORY_CONTENT_SLICE_LENGTH)}${BRIEF_MEMORY_TRUNCATION_ELLIPSIS}`
            : m.content;
        lines.push(`- **${m.name}**: ${content}`);
      }
    }

    if (overflow > 0) {
      lines.push(`\n_${overflow} more memories available via \`list_memories\` MCP tool._`);
    }

    return lines;
  }

  /**
   * Lists “signal” dependencies (frameworks, DB clients, test runners, etc.) from an allowlist; everything else is only a count.
   */
  private buildDependenciesLines(sd: BriefProjectScanData): string[] {
    if (!sd?.dependencies?.length) return [];

    const important = sd.dependencies.filter((d) => IMPORTANT_DEPENDENCY_NAME_SET.has(d));
    const lines: string[] = ['\n## Key Dependencies'];

    if (important.length) lines.push(important.join(', '));

    const remaining = sd.dependencies.length - important.length;
    if (remaining > 0) lines.push(`_+ ${remaining} other dependencies_`);

    return lines;
  }
}
