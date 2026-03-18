// NPM
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
// Shared
import { CreateWorkspaceSchema } from '@my-agents/shared';
// Services
import { orchestratorService } from '../services/index.js';
// Config
import { listRuntimes } from '../config/agent-runtimes.js';

export const workspacesRoute = new Hono()
  .get('/agent-runtimes', (c) => {
    return c.json(listRuntimes());
  })
  .get('/', async (c) => {
    const status = c.req.query('status');
    const workspaces = status === 'active'
      ? await orchestratorService.listActive()
      : await orchestratorService.listAll();
    return c.json(workspaces);
  })
  .get('/:id', async (c) => {
    const workspace = await orchestratorService.getStatus(c.req.param('id'));
    return c.json(workspace);
  })
  .post('/', zValidator('json', CreateWorkspaceSchema), async (c) => {
    const { taskId, agentRuntimeId } = c.req.valid('json');
    const workspace = await orchestratorService.startWork(taskId, agentRuntimeId);
    return c.json(workspace, 201);
  })
  .post('/:id/stop', async (c) => {
    const workspace = await orchestratorService.stopWork(c.req.param('id'));
    return c.json(workspace);
  })
  .delete('/:id', async (c) => {
    await orchestratorService.cleanup(c.req.param('id'));
    return c.body(null, 204);
  });
