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

const FILE_PATH = 'services/design-context-generator/design-context-generator.service.ts';

/** Max lines to read from any single source file to keep the prompt focused. */
const MAX_FILE_LINES = 200;

/** Candidate filenames to look for when scanning for the main CSS file. */
const CSS_FILE_CANDIDATES = [
  'src/index.css',
  'src/app.css',
  'src/globals.css',
  'src/styles/globals.css',
  'src/styles/index.css',
  'app/globals.css',
  'styles/globals.css',
  'index.css',
];

/** Candidate filenames for Tailwind configuration. */
const TAILWIND_CONFIG_CANDIDATES = [
  'tailwind.config.ts',
  'tailwind.config.js',
  'tailwind.config.mjs',
  'tailwind.config.cjs',
];

/** Default model to use per provider type when no preference is set. */
const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-3-5-haiku-20241022',
  openai: 'gpt-4o-mini',
  'openai-compatible': 'gpt-4o-mini',
  google: 'gemini-1.5-flash',
  ollama: 'llama3.1',
};

/** Provider type preference order — prefer the most capable for generation tasks. */
const PROVIDER_PREFERENCE: string[] = ['anthropic', 'openai', 'google', 'openai-compatible', 'ollama'];

export class DesignContextGeneratorService {
  /**
   * Generates a DESIGN.md from project scan data and any discoverable design
   * source files, saves it to the project, and returns the updated project.
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
   * Selects the best available provider from the configured list.
   * Prefers Anthropic → OpenAI → Google → openai-compatible → Ollama.
   * Throws if no providers are configured.
   */
  private async resolveProvider(): Promise<AgentProvider> {
    const providers = await agentProvidersService.list();
    if (providers.length === 0) {
      throw new AppError('No AI providers configured. Add a provider in Settings before generating design context.');
    }

    for (const preferred of PROVIDER_PREFERENCE) {
      const match = providers.find((p) => p.type === preferred);
      if (match) return match;
    }

    return providers[0]!;
  }

  /**
   * Attempts to read the main CSS file and Tailwind config from the project's
   * local path. Returns an empty object if the path is unavailable or files
   * are not found — generation still proceeds with scan data alone.
   */
  private scanDesignFiles(localPath: string | null): Record<string, string> {
    if (!localPath) return {};

    const files: Record<string, string> = {};

    for (const candidate of CSS_FILE_CANDIDATES) {
      const filePath = path.join(localPath, candidate);
      const content = this.tryReadFile(filePath);
      if (content) {
        files[candidate] = content;
        break; // Only read the first CSS file found
      }
    }

    for (const candidate of TAILWIND_CONFIG_CANDIDATES) {
      const filePath = path.join(localPath, candidate);
      const content = this.tryReadFile(filePath);
      if (content) {
        files[candidate] = content;
        break; // Only read the first Tailwind config found
      }
    }

    return files;
  }

  /** Reads a file and returns its content (capped at MAX_FILE_LINES), or null if unreadable. */
  private tryReadFile(filePath: string): string | null {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const lines = raw.split('\n');
      const truncated = lines.length > MAX_FILE_LINES;
      const content = lines.slice(0, MAX_FILE_LINES).join('\n');
      return truncated ? `${content}\n/* ... truncated at ${MAX_FILE_LINES} lines */` : content;
    } catch {
      return null;
    }
  }

  /**
   * Builds the generation prompt from project metadata and any discovered
   * design source files.
   */
  private buildPrompt(project: Project, sourceFiles: Record<string, string>): string {
    const sd = project.scanData;
    const lines: string[] = [];

    lines.push(
      'You are a design system analyst. Analyze the following project context and produce a structured DESIGN.md file.',
      '',
      'The DESIGN.md will be injected into AI agent prompts so agents can build UI that is visually consistent with the codebase.',
      'Be specific and accurate — only describe what you can infer from the provided data. Do not invent values.',
      '',
      '---',
      '',
      '## Project',
      `**Name:** ${project.name}`,
    );

    if (project.description) lines.push(`**Description:** ${project.description}`);
    if (sd?.projectType) lines.push(`**Type:** ${sd.projectType}`);
    if (sd?.languages?.length) lines.push(`**Languages:** ${sd.languages.join(', ')}`);
    if (sd?.packageManager) lines.push(`**Package Manager:** ${sd.packageManager}`);

    // UI-relevant dependencies
    const uiDeps = (sd?.dependencies ?? []).filter((d) =>
      [
        'react',
        'vue',
        'svelte',
        'solid-js',
        'angular',
        'next',
        'nuxt',
        'remix',
        'astro',
        'tailwindcss',
        '@tailwindcss/vite',
        '@radix-ui',
        'shadcn',
        '@shadcn/ui',
        'styled-components',
        '@emotion/react',
        '@stitches/react',
        'chakra-ui',
        '@chakra-ui/react',
        'mantine',
        '@mantine/core',
        'antd',
        'ant-design',
        'material-ui',
        '@mui/material',
        'framer-motion',
        'react-spring',
        'lucide-react',
        'react-icons',
        '@heroicons/react',
      ].some((keyword) => d.includes(keyword)),
    );

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

    // Attach any source files found
    for (const [filename, content] of Object.entries(sourceFiles)) {
      lines.push('', `## Source: \`${filename}\``, '', '```', content, '```');
    }

    lines.push(
      '',
      '---',
      '',
      '## Your Task',
      '',
      'Produce a DESIGN.md for this project. Structure it with these sections (include only what you can infer):',
      '',
      '1. **Visual Theme** — style, tone, dark/light mode support',
      '2. **Color Palette** — all color tokens with their values',
      '3. **Typography** — font families, size scale, weights',
      '4. **Spacing & Sizing** — border radius tokens, common gap values, fixed dimensions',
      '5. **Components** — visual spec for key components (Button, Card, Input, Badge, Dialog, etc.)',
      '6. **Animations & Transitions** — if present',
      '7. **Theming Notes for AI Agents** — practical rules an agent must follow when building UI',
      '',
      'Format as clean markdown. Be concise and developer-focused.',
      'Start your response directly with the `# <ProjectName> Design System` heading — no preamble.',
    );

    return lines.join('\n');
  }

  /** Dispatches the AI call to the correct provider SDK. */
  private async callProvider(provider: AgentProvider, prompt: string): Promise<string> {
    const model = DEFAULT_MODELS[provider.type] ?? 'gpt-4o-mini';

    if (provider.type === 'anthropic') {
      const client = await createAnthropicClient(provider.apiKey ?? '');
      const response = await client.messages.create({
        model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });
      const block = response.content[0];
      return block?.type === 'text' ? block.text : '';
    }

    // OpenAI, openai-compatible, Google, Ollama — all OpenAI-compatible
    const baseUrl =
      provider.type === 'google'
        ? GOOGLE_AI_BASE
        : provider.type === 'ollama'
          ? (provider.baseUrl ?? DEFAULT_OLLAMA_URL)
          : (provider.baseUrl ?? undefined);

    const client = await createOpenAIClient(provider.apiKey ?? '', baseUrl);
    const response = await client.chat.completions.create({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0]?.message.content ?? '';
  }
}
