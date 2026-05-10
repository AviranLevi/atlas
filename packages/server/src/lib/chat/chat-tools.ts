// External
import fs from 'node:fs';
import path from 'node:path';

// Shared
import type {
  CreateAgent,
  CreateMemory,
  CreateRule,
  CreateSkill,
  CreateTask,
  ExecutionMode,
  UpdateTask,
} from '@atlas/shared';

// Repositories
import { projectDocsRepository } from '../../db/repositories/index.js';

// Services
import {
  agentsService,
  memoryService,
  orchestratorService,
  projectsService,
  rulesService,
  searchService,
  skillsService,
  tasksService,
} from '../../services/index.js';

// Lib
import type { ToolContext, ToolDefinition } from './chat.types.js';
import { logger } from '../logger.js';

const FILE_PATH = 'lib/chat/chat-tools.ts';

/** Tool names that create or modify data — stripped in plan-only mode. */
const MUTATING_TOOL_NAMES = new Set([
  'create_task',
  'update_task',
  'create_agent',
  'create_rule',
  'create_skill',
  'create_memory',
]);

/** Returns the tool list filtered for the given execution mode. */
export function getToolsForMode(mode: ExecutionMode): ToolDefinition[] {
  if (mode === 'plan-only') {
    return CHAT_TOOLS.filter((t) => !MUTATING_TOOL_NAMES.has(t.name));
  }
  return CHAT_TOOLS;
}

export const CHAT_TOOLS: ToolDefinition[] = [
  {
    name: 'create_task',
    description: 'Create a new task on the kanban board.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Task name/title' },
        status: {
          type: 'string',
          enum: ['To Do', 'In Progress', 'In Review', 'Done'],
          description: 'Initial status',
        },
        priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
        estimate: { type: 'string', enum: ['S', 'M', 'L'] },
        notes: { type: 'string', description: 'Additional notes' },
        definitionOfDone: { type: 'string', description: 'Acceptance criteria' },
        agentId: {
          type: 'string',
          description: 'UUID of the agent to assign. Use the ID from a tagged @mention or from list_agents.',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_tasks',
    description: 'List tasks, optionally filtered by status or project.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['To Do', 'In Progress', 'In Review', 'Done'] },
      },
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task (status, notes, priority, etc).',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID (UUID)' },
        status: { type: 'string', enum: ['To Do', 'In Progress', 'In Review', 'Done'] },
        priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
        notes: { type: 'string' },
        name: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_agent',
    description: 'Create a new AI agent with a name, description, and personality.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        personality: { type: 'string', description: 'How the agent should behave' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_agents',
    description: 'List all configured AI agents.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'create_rule',
    description: 'Create a coding rule that agents must follow.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { type: 'string', enum: ['Backend', 'Frontend', 'Godot', 'General'] },
        content: { type: 'string', description: 'The rule content/instructions' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Optional labels' },
      },
      required: ['name', 'content'],
    },
  },
  {
    name: 'list_rules',
    description: 'List all coding rules.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'create_skill',
    description: 'Create a new skill (a reusable workflow or capability for agents).',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: {
          type: 'string',
          enum: [
            'Planning',
            'Coding',
            'Review',
            'Architecture / Data',
            'Planning / Roadmapping',
            'Design / Systems',
            'Design',
            'Design / Balancing',
          ],
        },
        steps: { type: 'string', description: 'Step-by-step instructions' },
      },
      required: ['name', 'type'],
    },
  },
  {
    name: 'list_skills',
    description: 'List all available skills.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'create_memory',
    description: 'Save a decision, convention, preference, or problem as a memory entry for future reference.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Short title for the memory' },
        type: { type: 'string', enum: ['Decision', 'Convention', 'Preference', 'Problem'] },
        content: { type: 'string', description: 'Detailed description' },
        scope: {
          type: 'string',
          enum: ['global', 'project'],
          description: 'Whether this applies globally or to the current project',
        },
      },
      required: ['name', 'type', 'content', 'scope'],
    },
  },
  {
    name: 'list_memories',
    description: 'List project memories (decisions, conventions, preferences, problems).',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'search',
    description: 'Full-text search across all entities (tasks, agents, rules, skills, memory, projects).',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_project_context',
    description: 'Get the full project context including brief, tech stack, and current state.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'browse_project_files',
    description: 'List files and directories at a given path within the project. Use to explore the project structure.',
    parameters: {
      type: 'object',
      properties: {
        relativePath: {
          type: 'string',
          description: 'Path relative to project root. Use "." or empty string for root.',
        },
        maxDepth: { type: 'number', description: 'How many levels deep to list. Default 1.' },
      },
    },
  },
  {
    name: 'read_file',
    description:
      'Read the contents of a file within the project. Use after browse_project_files to inspect specific files.',
    parameters: {
      type: 'object',
      properties: {
        relativePath: {
          type: 'string',
          description: 'Path to the file relative to the project root (e.g. "src/auth/auth.service.ts").',
        },
      },
      required: ['relativePath'],
    },
  },
  {
    name: 'list_workspaces',
    description: 'List agent workspaces (running, completed, or failed agent work sessions).',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_project_docs',
    description: 'Get all documentation for the current project — API diagrams, DB schema, plans, and custom docs.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['api-diagram', 'db-schema', 'architecture', 'plan', 'custom'],
          description: 'Filter by doc type. Omit to get all docs.',
        },
      },
    },
  },
];

function isResolvedPathInsideRoot(root: string, candidate: string): boolean {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const prefix = resolvedRoot.endsWith(path.sep) ? resolvedRoot : `${resolvedRoot}${path.sep}`;
  return resolvedCandidate === resolvedRoot || resolvedCandidate.startsWith(prefix);
}

/** Runs a named chat tool with validated-style args and request context. */
export async function executeTool(name: string, args: Record<string, unknown>, context: ToolContext): Promise<unknown> {
  try {
    switch (name) {
      case 'create_task': {
        const data = {
          ...args,
          projectId: context.projectId ?? undefined,
        } as CreateTask;
        return await tasksService.create(data);
      }
      case 'list_tasks': {
        const filters: { status?: string; projectId?: string } = {};
        if (typeof args.status === 'string') filters.status = args.status;
        if (context.projectId) filters.projectId = context.projectId;
        return await tasksService.list(filters);
      }
      case 'update_task': {
        const { id, ...rest } = args as { id: string } & Record<string, unknown>;
        return await tasksService.update(id, rest as UpdateTask);
      }
      case 'create_agent':
        return await agentsService.create(args as CreateAgent);
      case 'list_agents':
        return await agentsService.list();
      case 'create_rule': {
        const raw = args as Record<string, unknown>;
        const data = {
          name: raw.name,
          type: typeof raw.type === 'string' ? raw.type : 'General',
          content: raw.content,
          tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
        } as CreateRule;
        return await rulesService.create(data);
      }
      case 'list_rules':
        return await rulesService.list({ projectId: context.projectId ?? undefined });
      case 'create_skill': {
        const raw = args as Record<string, unknown>;
        const data = {
          name: raw.name,
          type: raw.type,
          steps: typeof raw.steps === 'string' ? raw.steps : null,
          inputFormat: null,
          outputFormat: null,
        } as CreateSkill;
        return await skillsService.create(data);
      }
      case 'list_skills':
        return await skillsService.list({ projectId: context.projectId ?? undefined });
      case 'create_memory': {
        const scope = args.scope as string;
        if (scope === 'project' && !context.projectId) {
          return { error: 'No project selected for project-scoped memory' };
        }
        const payload: CreateMemory = {
          name: args.name as string,
          type: args.type as CreateMemory['type'],
          content: args.content as string,
          scope: args.scope as CreateMemory['scope'],
          projectId: scope === 'project' ? context.projectId! : null,
        };
        return await memoryService.create(payload);
      }
      case 'list_memories': {
        if (!context.projectId) return [];
        return await memoryService.listByProject(context.projectId);
      }
      case 'search':
        return searchService.search(args.query as string);
      case 'get_project_context': {
        if (!context.projectId) return { error: 'No project selected' };
        return await projectsService.getContext(context.projectId);
      }
      case 'browse_project_files': {
        if (!context.projectLocalPath) return { error: 'No project local path configured' };
        const relativePath =
          typeof args.relativePath === 'string' && args.relativePath.length > 0 ? args.relativePath : '.';
        const maxDepth = typeof args.maxDepth === 'number' && args.maxDepth >= 0 ? args.maxDepth : 1;
        const root = path.resolve(context.projectLocalPath);
        const fullPath = path.resolve(root, relativePath);
        if (!isResolvedPathInsideRoot(root, fullPath)) {
          return { error: 'Path traversal not allowed' };
        }
        return listDirectory(fullPath, maxDepth);
      }
      case 'read_file': {
        if (!context.projectLocalPath) return { error: 'No project local path configured' };
        const relativePath = typeof args.relativePath === 'string' ? args.relativePath : '';
        if (!relativePath) return { error: 'relativePath is required' };
        const root = path.resolve(context.projectLocalPath);
        const fullPath = path.resolve(root, relativePath);
        if (!isResolvedPathInsideRoot(root, fullPath)) {
          return { error: 'Path traversal not allowed' };
        }
        if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
          return { error: `File not found: ${relativePath}` };
        }
        const MAX_BYTES = 100_000; // 100 KB cap — avoids sending huge build artifacts
        const stat = fs.statSync(fullPath);
        if (stat.size > MAX_BYTES) {
          return {
            error: `File is too large to read (${Math.round(stat.size / 1024)} KB). Read a specific range instead.`,
          };
        }
        const content = fs.readFileSync(fullPath, 'utf-8');
        return { relativePath, content };
      }
      case 'list_workspaces':
        return await orchestratorService.listAll();
      case 'get_project_docs': {
        if (!context.projectId) return { error: 'No project selected' };
        const docs = projectDocsRepository.findByProjectId(context.projectId);
        const type = typeof args.type === 'string' ? args.type : null;
        return type ? docs.filter((d) => d.type === type) : docs;
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: executeTool(${name})`, error);
    return { error: error instanceof Error ? error.message : 'Tool execution failed' };
  }
}

function listDirectory(dirPath: string, maxDepth: number, currentDepth = 0): unknown {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return { error: 'Path does not exist or is not a directory' };
  }

  const entries = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((e) => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== '__pycache__')
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((e) => {
      const entry: Record<string, unknown> = {
        name: e.name,
        type: e.isDirectory() ? 'directory' : 'file',
      };
      if (e.isDirectory() && currentDepth < maxDepth - 1) {
        entry.children = listDirectory(path.join(dirPath, e.name), maxDepth, currentDepth + 1);
      }
      return entry;
    });

  return entries;
}
