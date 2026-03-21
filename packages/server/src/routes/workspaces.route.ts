// NPM
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
// Shared
import { CreateWorkspaceSchema, AddDiffCommentSchema } from '@my-agents/shared';
// Services
import { orchestratorService } from '../services/index.js';
// Executors
import { executorRegistry } from '../executors/index.js';

export const workspacesRoute = new Hono()
  .get('/agent-runtimes', async (c) => {
    return c.json(await executorRegistry.listAll());
  })
  .post('/agent-runtimes/refresh', async (c) => {
    await executorRegistry.refresh();
    return c.json(await executorRegistry.listAll());
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
  .get('/:id/diff', async (c) => {
    const diff = await orchestratorService.getDiff(c.req.param('id'));
    return c.json(diff);
  })
  .post('/:id/merge', async (c) => {
    const workspace = await orchestratorService.mergeAndClose(c.req.param('id'));
    return c.json(workspace);
  })
  .post('/:id/comments', zValidator('json', AddDiffCommentSchema), (c) => {
    const data = c.req.valid('json');
    const workspace = orchestratorService.addDiffComment(c.req.param('id'), data);
    return c.json(workspace, 201);
  })
  .post('/:id/comments/:commentId', async (c) => {
    const { body } = await c.req.json<{ body: string }>();
    const workspace = orchestratorService.editDiffComment(
      c.req.param('id'),
      c.req.param('commentId'),
      body,
    );
    return c.json(workspace);
  })
  .delete('/:id/comments/:commentId', (c) => {
    const workspace = orchestratorService.removeDiffComment(
      c.req.param('id'),
      c.req.param('commentId'),
    );
    return c.json(workspace);
  })
  .post('/:id/stop', async (c) => {
    const workspace = await orchestratorService.stopWork(c.req.param('id'));
    return c.json(workspace);
  })
  .delete('/:id', async (c) => {
    await orchestratorService.cleanup(c.req.param('id'));
    return c.body(null, 204);
  });
