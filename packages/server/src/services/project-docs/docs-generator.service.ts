// External
import fs from 'node:fs';
import path from 'node:path';
import { generateText } from 'ai';

// Shared
import type { Project } from '@atlas/shared';

// Services
import { agentProvidersService, agentsService, projectsService } from '../index.js';

// Lib
import { buildAiModel } from '../../lib/ai/ai-client.js';
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/project-docs/docs-generator.service.ts';

const MAX_TOTAL_BYTES = 80 * 1024; // 80 KB cap on scanned file content
const SKIP_DIRS = new Set(['node_modules', 'dist', '__pycache__', '.git', '.next', 'build', 'coverage']);

const SYSTEM_PROMPT =
  'You are a technical documentation expert. Generate concise, accurate Mermaid diagrams from code. ' +
  'Return ONLY a single markdown heading followed by a SINGLE ```mermaid code fence containing the complete diagram. ' +
  'Never split the diagram across multiple code fences. Never add prose, explanations, or extra code blocks.';

const API_SYSTEM_PROMPT =
  'You are a technical documentation expert. Generate concise, accurate API documentation from code. ' +
  'Return ONLY structured markdown with grouped tables. No Mermaid, no diagrams, no prose outside headings and tables.';

export class DocsGeneratorService {
  /** Generates a Mermaid flowchart of API endpoints from route files or an OpenAPI spec. */
  async generateApiDiagram(project: Project): Promise<string> {
    const FUNCTION_NAME = 'generateApiDiagram';
    try {
      const localPath = project.localPath!;

      // Prefer an OpenAPI/Swagger spec if one exists — it's more structured than raw route files.
      const specContent = this.scanForOpenApiSpec(localPath);
      let content: string;
      let promptIntro: string;

      if (specContent) {
        content = specContent;
        promptIntro = 'Given this OpenAPI/Swagger specification, generate a Mermaid flowchart diagram showing all API endpoints grouped by resource/tag.';
      } else {
        const routePatterns = [/\.route\.ts$/, /\.routes\.ts$/, /routes\.\w+$/, /\.controller\.ts$/];
        const files = this.scanFiles(localPath, (name) => routePatterns.some((p) => p.test(name)));
        content = this.readFileContents(files);
        promptIntro = 'Given these route/controller files, generate a Mermaid flowchart diagram showing all API endpoints grouped by resource.';
      }

      if (!content) {
        return '# API Endpoints\n\nNo route files or OpenAPI spec detected in this project.';
      }

      const model = await this.resolveModel(project.id);
      const result = await generateText({
        model,
        system: API_SYSTEM_PROMPT,
        prompt: [
          promptIntro,
          'Format the output as grouped markdown tables:',
          '',
          '## Resource Name',
          '',
          '| Method | Path | Description |',
          '|--------|------|-------------|',
          '| GET | `/users` | List all users |',
          '',
          'Rules:',
          '- Group endpoints by resource/domain (Users, Auth, Products, etc.)',
          '- Every endpoint gets a one-line description inferred from the code',
          '- Use exact paths with params as `:paramName`',
          '- Method must be uppercase (GET, POST, PUT, PATCH, DELETE)',
          '- If an OpenAPI spec is provided, include response codes in the description',
          '',
          content,
        ].join('\n'),
      });

      const swaggerUrl = this.detectSwaggerUrl(localPath);
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
      const schemaPatterns = [
        /\.schema\.ts$/,
        /\.entity\.ts$/,
        /\.model\.ts$/,
        /schema\.prisma$/,
        /migrations\/.*\.sql$/,
        /models\.py$/,
      ];
      const schemaFolderPatterns = /\/(schemas|models|entities)\//;
      const files = this.scanFiles(localPath, (name) =>
        schemaPatterns.some((p) => p.test(name)) || schemaFolderPatterns.test(name),
      );
      const content = this.readFileContents(files);

      if (!content) {
        return '# Database Schema\n\nNo schema/migration files detected in this project.';
      }

      const model = await this.resolveModel(project.id);
      const result = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt: [
          'Given these database schema definitions, generate a Mermaid ER diagram showing all tables and their columns.',
          'Use `erDiagram` format. Strict rules:',
          '- Output ONE complete `erDiagram` block — never split into multiple blocks',
          '- Each attribute line must be exactly: `type attributeName` with NO quoted strings after it',
          '- Use camelCase for attribute names — no underscores',
          '- Omit all relationship lines — show tables and columns only',
          '- Do NOT use comments, quoted descriptions, or any text after the attribute name',
          '',
          content,
        ].join('\n'),
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

      const topLevel = this.listTopLevel(localPath);
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
        system: SYSTEM_PROMPT,
        prompt: [
          'Given this project context, generate a Mermaid diagram showing the high-level system architecture — services, data stores, and key interactions.',
          'Use `graph TD` format. Strict rules for valid Mermaid graph syntax:',
          '- Node IDs must be single words with NO spaces (use camelCase or underscores: `nextApi`, `postgres_db`)',
          '- Node labels go in brackets: `nextApi["Next.js API"]`',
          '- Edges use `-->` with optional quoted labels: `nextApi -->|"reads"| postgresDb`',
          '- NEVER use `=`, spaces in node IDs, or bare text outside node/edge definitions',
          '- Output ONE complete `graph TD` block only',
          '',
          contextParts.join('\n\n'),
        ].join('\n'),
      });

      return `# System Architecture\n\n${result.text}`;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to generate architecture diagram', { cause: error });
    }
  }

  /**
   * Resolves an AI model for the project by finding the project's
   * first assigned agent that has a provider configured.
   */
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
      logger.info(
        `${FILE_PATH} :: resolveModel - no project agent has a provider, falling back to "${provider.name}"`,
      );
      return buildAiModel(provider);
    }

    throw new AppError(
      'No AI provider configured. Add a provider in Settings → Providers to enable doc generation.',
      { status: 400 },
    );
  }

  /**
   * Looks for an OpenAPI/Swagger spec file in the project root and common subdirectories.
   * Returns file contents (capped at 50 KB) if found, null otherwise.
   */
  private scanForOpenApiSpec(localPath: string): string | null {
    const SPEC_NAMES = [
      'openapi.json', 'openapi.yaml', 'openapi.yml',
      'swagger.json', 'swagger.yaml', 'swagger.yml',
      'swagger-spec.json',
    ];
    const SPEC_DIRS = ['', 'docs', 'swagger', 'api-docs', 'openapi'];
    const MAX_SPEC_BYTES = 50 * 1024;

    for (const dir of SPEC_DIRS) {
      for (const name of SPEC_NAMES) {
        const filePath = dir ? path.join(localPath, dir, name) : path.join(localPath, name);
        try {
          if (!fs.existsSync(filePath)) continue;
          const stat = fs.statSync(filePath);
          if (stat.size > MAX_SPEC_BYTES) continue;
          return fs.readFileSync(filePath, 'utf-8');
        } catch {
          // Skip unreadable files
        }
      }
    }
    return null;
  }

  /**
   * Attempts to detect a Swagger UI URL by reading package.json scripts and .env files.
   * Returns a URL string like "http://localhost:3000/api-docs" or null if no port is found.
   */
  private detectSwaggerUrl(localPath: string): string | null {
    const port = this.detectPort(localPath);
    if (!port) return null;

    const swaggerPath = this.detectSwaggerPath(localPath);
    return `http://localhost:${port}${swaggerPath}`;
  }

  private detectPort(localPath: string): number | null {
    // 1. Scan package.json scripts
    try {
      const pkgPath = path.join(localPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
        const scripts = (pkg.scripts ?? {}) as Record<string, string>;
        for (const script of Object.values(scripts)) {
          const portMatch =
            /--port[= ](\d+)/.exec(script) ??
            /\bPORT=(\d+)/.exec(script) ??
            /(?<!\w)-p[= ](\d+)/.exec(script);
          if (portMatch) return parseInt(portMatch[1], 10);
        }
      }
    } catch {
      // Fall through to .env scan
    }

    // 2. Scan .env files
    const envFiles = ['.env.local', '.env', '.env.development', '.env.example'];
    for (const envFile of envFiles) {
      try {
        const envPath = path.join(localPath, envFile);
        if (!fs.existsSync(envPath)) continue;
        const content = fs.readFileSync(envPath, 'utf-8');
        const portMatch = /^(?:APP_)?PORT=(\d+)/m.exec(content);
        if (portMatch) return parseInt(portMatch[1], 10);
      } catch {
        // Skip unreadable files
      }
    }

    return null;
  }

  private detectSwaggerPath(localPath: string): string {
    try {
      const pkgPath = path.join(localPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
        const deps = {
          ...((pkg.dependencies ?? {}) as Record<string, string>),
          ...((pkg.devDependencies ?? {}) as Record<string, string>),
        };
        if ('@nestjs/swagger' in deps) return '/api-docs';
        if ('swagger-ui-express' in deps || 'swagger-jsdoc' in deps) return '/api-docs';
        if ('fastify-swagger' in deps || '@fastify/swagger' in deps) return '/documentation';
      }
    } catch {
      // Fall through to default
    }
    return '/api-docs';
  }

  /** Recursively scans a directory for files matching the predicate. */
  private scanFiles(rootPath: string, predicate: (relativePath: string) => boolean): string[] {
    const results: string[] = [];
    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile()) {
          const rel = path.relative(rootPath, full);
          if (predicate(rel)) results.push(full);
        }
      }
    };
    walk(rootPath);
    return results;
  }

  /** Reads file contents up to the MAX_TOTAL_BYTES cap. */
  private readFileContents(files: string[]): string {
    const parts: string[] = [];
    let totalBytes = 0;

    for (const filePath of files) {
      if (totalBytes >= MAX_TOTAL_BYTES) break;
      try {
        const stat = fs.statSync(filePath);
        if (stat.size > MAX_TOTAL_BYTES - totalBytes) continue;
        const content = fs.readFileSync(filePath, 'utf-8');
        parts.push(`### File: ${path.basename(filePath)}\n\`\`\`\n${content}\n\`\`\``);
        totalBytes += stat.size;
      } catch {
        // Skip unreadable files
      }
    }

    return parts.join('\n\n');
  }

  /** Lists top-level directory entries (non-hidden, non-skip). */
  private listTopLevel(rootPath: string): string {
    try {
      const entries = fs.readdirSync(rootPath, { withFileTypes: true });
      return entries
        .filter((e) => !e.name.startsWith('.') && !SKIP_DIRS.has(e.name))
        .map((e) => `${e.isDirectory() ? '📁' : '📄'} ${e.name}`)
        .join('\n');
    } catch {
      return '';
    }
  }
}
