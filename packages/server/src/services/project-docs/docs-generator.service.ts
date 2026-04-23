import fs from 'node:fs';
import path from 'node:path';
import { generateText } from 'ai';

import type { Project } from '@atlas/shared';

import { agentProvidersService, projectsService } from '../index.js';
import { buildAiModel } from '../../lib/ai/ai-client.js';
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

import { ROUTE_PATTERNS, SCHEMA_FILE_PATTERNS, SCHEMA_FOLDER_PATTERN } from './docs-generator.constants.js';
import {
  API_TABLE_SYSTEM_PROMPT,
  MERMAID_SYSTEM_PROMPT,
  buildApiTablePrompt,
  buildArchitecturePrompt,
  buildDbSchemaPrompt,
} from './docs-generator.prompt.js';
import {
  detectSwaggerUrl,
  listTopLevel,
  readFileContents,
  scanFiles,
  scanForOpenApiSpec,
} from './docs-generator.utils.js';

const FILE_PATH = 'services/project-docs/docs-generator.service.ts';

export class DocsGeneratorService {
  /** Generates grouped markdown tables of API endpoints from route files or an OpenAPI spec. */
  async generateApiDiagram(project: Project): Promise<string> {
    const FUNCTION_NAME = 'generateApiDiagram';
    try {
      const localPath = project.localPath!;
      const specContent = scanForOpenApiSpec(localPath);
      let content: string;
      let promptIntro: string;

      if (specContent) {
        content = specContent;
        promptIntro =
          'Given this OpenAPI/Swagger specification, generate API endpoint documentation grouped by resource/tag.';
      } else {
        const files = scanFiles(localPath, (name) => ROUTE_PATTERNS.some((p) => p.test(name)));
        content = readFileContents(files);
        promptIntro = 'Given these route/controller files, generate API endpoint documentation grouped by resource.';
      }

      if (!content) {
        return '# API Endpoints\n\nNo route files or OpenAPI spec detected in this project.';
      }

      const model = await this.resolveModel(project.id);
      const result = await generateText({
        model,
        system: API_TABLE_SYSTEM_PROMPT,
        prompt: buildApiTablePrompt(promptIntro, content),
      });

      const swaggerUrl = detectSwaggerUrl(localPath);
      const swaggerNote = swaggerUrl
        ? `\n\n---\n\n> **Swagger UI** (auto-detected — may differ): [Open Swagger UI](${swaggerUrl})`
        : '';

      return `# API Endpoints\n\n${result.text}${swaggerNote}`;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to generate API diagram', { cause: error });
    }
  }

  /** Generates a Mermaid ER diagram from database schema files. */
  async generateDbSchema(project: Project): Promise<string> {
    const FUNCTION_NAME = 'generateDbSchema';
    try {
      const localPath = project.localPath!;
      const files = scanFiles(
        localPath,
        (name) => SCHEMA_FILE_PATTERNS.some((p) => p.test(name)) || SCHEMA_FOLDER_PATTERN.test(name),
      );
      const content = readFileContents(files);

      if (!content) {
        return '# Database Schema\n\nNo schema/migration files detected in this project.';
      }

      const model = await this.resolveModel(project.id);
      const result = await generateText({
        model,
        system: MERMAID_SYSTEM_PROMPT,
        prompt: buildDbSchemaPrompt(content),
      });

      return `# Database Schema\n\n${result.text}`;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to generate DB schema diagram', { cause: error });
    }
  }

  /** Generates a Mermaid architecture diagram from project context. */
  async generateArchitecture(project: Project): Promise<string> {
    const FUNCTION_NAME = 'generateArchitecture';
    try {
      const localPath = project.localPath!;
      const contextParts: string[] = [];

      if (project.description) {
        contextParts.push(`## Project Description\n${project.description}`);
      }
      if (project.techStack) {
        contextParts.push(`## Tech Stack\n${project.techStack}`);
      }
      if (project.scanData) {
        const scan = typeof project.scanData === 'string' ? project.scanData : JSON.stringify(project.scanData);
        contextParts.push(`## Scan Data\n${scan}`);
      }

      const topLevel = listTopLevel(localPath);
      if (topLevel) {
        contextParts.push(`## Top-Level Directory\n${topLevel}`);
      }

      const readmePath = path.join(localPath, 'README.md');
      if (fs.existsSync(readmePath)) {
        const readme = fs.readFileSync(readmePath, 'utf-8').slice(0, 4000);
        contextParts.push(`## README.md\n${readme}`);
      }

      if (contextParts.length === 0) {
        return '# System Architecture\n\nInsufficient project data to generate an architecture diagram.';
      }

      const model = await this.resolveModel(project.id);
      const result = await generateText({
        model,
        system: MERMAID_SYSTEM_PROMPT,
        prompt: buildArchitecturePrompt(contextParts),
      });

      return `# System Architecture\n\n${result.text}`;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to generate architecture diagram', { cause: error });
    }
  }

  private async resolveModel(projectId: string) {
    const ctx = await projectsService.getContext(projectId);
    const agents = (ctx.agents ?? []) as Array<{ providerId?: string | null; defaultModel?: string | null }>;

    for (const agent of agents) {
      if (agent.providerId) {
        const provider = await agentProvidersService.getById(agent.providerId);
        return buildAiModel(provider, agent.defaultModel ?? undefined);
      }
    }

    const allProviders = await agentProvidersService.list();
    if (allProviders.length > 0) {
      const provider = allProviders[0];
      logger.info(`${FILE_PATH} :: resolveModel - no project agent has a provider, falling back to "${provider.name}"`);
      return buildAiModel(provider);
    }

    throw new AppError('No AI provider configured. Add a provider in Settings → Providers to enable doc generation.', {
      status: 400,
    });
  }
}
