// External
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Services
import { orchestratorService } from '../services/index.js';

// Executors
import { executorRegistry } from '../executors/index.js';

export function registerWorkspaceTools(server: McpServer) {
  server.registerTool(
    'list_agent_runtimes',
    {
      description: 'List available agent runtimes (CLI tools) that can execute tasks',
      inputSchema: z.object({}),
    },
    async () => {
      const runtimes = await executorRegistry.listAll();
      return { content: [{ type: 'text' as const, text: JSON.stringify(runtimes, null, 2) }] };
    },
  );

  server.registerTool(
    'start_workspace',
    {
      description:
        'Start work on a task by creating a git worktree and spawning an agent CLI. ' +
        'The task must be assigned to a project with a configured local path.',
      inputSchema: z.object({
        taskId: z.string().uuid().describe('The task UUID to start work on'),
        agentRuntimeId: z.string().min(1).describe('Agent runtime ID (e.g. "claude-code", "aider", "codex")'),
        baseBranch: z
          .string()
          .min(1)
          .optional()
          .describe('Git branch to create the worktree from (defaults to project default branch)'),
        model: z.string().min(1).optional().describe('LLM model override for the agent'),
        providerId: z.string().uuid().optional().describe('Provider UUID for API-key resolution'),
      }),
    },
    async ({ taskId, agentRuntimeId, baseBranch, model, providerId }) => {
      const workspace = await orchestratorService.startWork(taskId, agentRuntimeId, baseBranch, model, providerId);
      return { content: [{ type: 'text' as const, text: JSON.stringify(workspace, null, 2) }] };
    },
  );

  server.registerTool(
    'list_workspaces',
    {
      description: 'List agent workspaces. Optionally filter to only active (running/pending) ones.',
      inputSchema: z.object({
        activeOnly: z.boolean().optional().describe('If true, only return running/pending workspaces'),
      }),
    },
    async ({ activeOnly }) => {
      const workspaces = activeOnly ? await orchestratorService.listActive() : await orchestratorService.listAll();
      return { content: [{ type: 'text' as const, text: JSON.stringify(workspaces, null, 2) }] };
    },
  );

  server.registerTool(
    'get_workspace_status',
    {
      description: 'Get detailed status of a workspace including agent output',
      inputSchema: z.object({
        id: z.string().uuid().describe('The workspace UUID'),
      }),
    },
    async ({ id }) => {
      const status = await orchestratorService.getStatus(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(status, null, 2) }] };
    },
  );

  server.registerTool(
    'stop_workspace',
    {
      description: 'Stop an active workspace by killing the agent process',
      inputSchema: z.object({
        id: z.string().uuid().describe('The workspace UUID to stop'),
      }),
    },
    async ({ id }) => {
      const workspace = await orchestratorService.stopWork(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(workspace, null, 2) }] };
    },
  );
}
