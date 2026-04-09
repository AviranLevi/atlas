// External
import fs from 'node:fs';
import path from 'node:path';

// Shared
import type { AgentProvider, Project } from '@atlas/shared';

// Services
import { agentProvidersService, projectsService } from '../index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';
import {
  DEFAULT_OLLAMA_URL,
  GOOGLE_AI_BASE,
  createAnthropicClient,
  createOpenAIClient,
} from '../../lib/providers/provider-clients.js';

// Constants
import {
  DEFAULT_DESIGN_CONTEXT_MODEL_FALLBACK,
  DEFAULT_DESIGN_CONTEXT_MODELS,
  DESIGN_CONTEXT_MAX_OUTPUT_TOKENS,
  DESIGN_CONTEXT_PROVIDER_PREFERENCE,
  DESIGN_CSS_FILE_CANDIDATES,
  DESIGN_TAILWIND_CONFIG_CANDIDATES,
  MAX_DESIGN_SOURCE_FILE_LINES,
  UI_DEPENDENCY_SUBSTRINGS,
} from './design-context-generator.constants.js';

// Types
import type { DesignSourceFileMap } from './design-context-generator.types.js';

// Prompts
import {
  DESIGN_CONTEXT_PROMPT_PREAMBLE_LINES,
  DESIGN_CONTEXT_PROMPT_TASK_LINES,
  designContextSourceFilePromptLines,
} from './design-context-generator.prompt.js';

const FILE_PATH = 'services/design-context-generator/design-context-generator.service.ts';

/**
 * Produces a DESIGN.md-style markdown string from project scan data plus optional on-disk CSS/Tailwind snippets,
 * then stores it on `Project.designContext` for injection into agent prompts.
 *
 * Flow: pick provider → read local design files → build user prompt → single completion → persist → return fresh project row.
 */
export class DesignContextGeneratorService {
  /**
   * End-to-end generation: loads project, calls the model, writes `designContext`, returns updated `Project`.
   */
  async generateAndSave(projectId: string): Promise<Project> {
    const FUNCTION_NAME = 'generateAndSave';
    try {
      const project = await projectsService.getById(projectId);
      const provider = await this.resolveProvider();
      const sourceFiles = this.scanDesignFiles(project.localPath ?? null);
      const prompt = this.buildPrompt(project, sourceFiles);
      const designContext = await this.callProvider(provider, prompt);

      await projectsService.update(projectId, { designContext });
      logger.info(
        `${FILE_PATH} :: ${FUNCTION_NAME} - generated design context for project ${projectId} (${designContext.length} chars)`,
      );

      return projectsService.getById(projectId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to generate design context', { cause: error });
    }
  }

  /**
   * Picks one configured provider: first match in `DESIGN_CONTEXT_PROVIDER_PREFERENCE`, else the first listed provider.
   */
  private async resolveProvider(): Promise<AgentProvider> {
    const providers = await agentProvidersService.list();
    if (providers.length === 0) {
      throw new AppError('No AI providers configured. Add a provider in Settings before generating design context.');
    }

    for (const preferred of DESIGN_CONTEXT_PROVIDER_PREFERENCE) {
      const match = providers.find((p) => p.type === preferred);
      if (match) return match;
    }

    return providers[0]!;
  }

  /**
   * Walks fixed candidate paths under `localPath` for one CSS file and one Tailwind config.
   * Missing path or files yields `{}`; generation still runs on scan-only context.
   */
  private scanDesignFiles(localPath: string | null): DesignSourceFileMap {
    if (!localPath) return {};

    const files: DesignSourceFileMap = {};

    for (const candidate of DESIGN_CSS_FILE_CANDIDATES) {
      const filePath = path.join(localPath, candidate);
      const content = this.tryReadFile(filePath);
      if (content) {
        files[candidate] = content;
        break;
      }
    }

    for (const candidate of DESIGN_TAILWIND_CONFIG_CANDIDATES) {
      const filePath = path.join(localPath, candidate);
      const content = this.tryReadFile(filePath);
      if (content) {
        files[candidate] = content;
        break;
      }
    }

    return files;
  }

  /** Sync read with line cap; returns `null` if the path is missing or unreadable. */
  private tryReadFile(filePath: string): string | null {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const lines = raw.split('\n');
      const truncated = lines.length > MAX_DESIGN_SOURCE_FILE_LINES;
      const content = lines.slice(0, MAX_DESIGN_SOURCE_FILE_LINES).join('\n');
      return truncated ? `${content}\n/* ... truncated at ${MAX_DESIGN_SOURCE_FILE_LINES} lines */` : content;
    } catch {
      return null;
    }
  }

  /** Assembles the full user message: role instructions, project facts, optional file bodies, then task rubric. */
  private buildPrompt(project: Project, sourceFiles: DesignSourceFileMap): string {
    const lines: string[] = [
      ...DESIGN_CONTEXT_PROMPT_PREAMBLE_LINES,
      ...this.buildPromptProjectSection(project),
      ...this.buildPromptSourceFileSections(sourceFiles),
      ...DESIGN_CONTEXT_PROMPT_TASK_LINES,
    ];
    return lines.join('\n');
  }

  /** Name, description, scan metadata, UI-related deps, and formatter flags from `project.scanData`. */
  private buildPromptProjectSection(project: Project): string[] {
    const sd = project.scanData;
    const lines: string[] = [`**Name:** ${project.name}`];

    if (project.description) lines.push(`**Description:** ${project.description}`);
    if (sd?.projectType) lines.push(`**Type:** ${sd.projectType}`);
    if (sd?.languages?.length) lines.push(`**Languages:** ${sd.languages.join(', ')}`);
    if (sd?.packageManager) lines.push(`**Package Manager:** ${sd.packageManager}`);

    const uiDeps = this.filterUiDependencies(sd?.dependencies);
    if (uiDeps.length > 0) {
      lines.push(`**UI Dependencies:** ${uiDeps.join(', ')}`);
    }

    if (sd?.formatting) {
      const tools: string[] = [];
      if (sd.formatting.prettier) tools.push('Prettier');
      if (sd.formatting.eslint) tools.push('ESLint');
      if (sd.formatting.biome) tools.push('Biome');
      if (tools.length) lines.push(`**Formatting:** ${tools.join(', ')}`);
    }

    return lines;
  }

  private filterUiDependencies(dependencies: string[] | undefined): string[] {
    return (dependencies ?? []).filter((d) => UI_DEPENDENCY_SUBSTRINGS.some((keyword) => d.includes(keyword)));
  }

  /** Fenced code blocks for each file returned by `scanDesignFiles`. */
  private buildPromptSourceFileSections(sourceFiles: DesignSourceFileMap): string[] {
    const lines: string[] = [];
    for (const [filename, content] of Object.entries(sourceFiles)) {
      lines.push(...designContextSourceFilePromptLines(filename, content));
    }
    return lines;
  }

  /**
   * Anthropic Messages API vs OpenAI-compatible (OpenAI, Google Gemini OpenAI shim, Ollama, custom base URL).
   */
  private async callProvider(provider: AgentProvider, prompt: string): Promise<string> {
    const model = DEFAULT_DESIGN_CONTEXT_MODELS[provider.type] ?? DEFAULT_DESIGN_CONTEXT_MODEL_FALLBACK;

    if (provider.type === 'anthropic') {
      const client = await createAnthropicClient(provider.apiKey ?? '');
      const response = await client.messages.create({
        model,
        max_tokens: DESIGN_CONTEXT_MAX_OUTPUT_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      });
      const block = response.content[0];
      return block?.type === 'text' ? block.text : '';
    }

    const baseUrl =
      provider.type === 'google'
        ? GOOGLE_AI_BASE
        : provider.type === 'ollama'
          ? (provider.baseUrl ?? DEFAULT_OLLAMA_URL)
          : (provider.baseUrl ?? undefined);

    const client = await createOpenAIClient(provider.apiKey ?? '', baseUrl);
    const response = await client.chat.completions.create({
      model,
      max_tokens: DESIGN_CONTEXT_MAX_OUTPUT_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0]?.message.content ?? '';
  }
}
