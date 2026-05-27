# Routes

> Applies to: `packages/server/src/routes/**/*.ts`

Routes are thin HTTP adapters. They validate input, call a service, and return a response.

## File Structure

One file per entity, exporting a Hono app instance:

```
packages/server/src/routes/
  agents.route.ts
  skills.route.ts
  rules.route.ts
  memory.route.ts
  projects.route.ts
  tasks.route.ts
  search.route.ts
  settings.route.ts
  index.ts            # Mounts all routes under /api/v1
```

## Route Pattern

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateAgentSchema, UpdateAgentSchema } from '@atlas/shared';
import { agentService } from '../services/agents.service';

export const agentsRoute = new Hono()
  .get('/', async (c) => {
    const agents = await agentService.listAgents();
    return c.json(agents);
  })
  .get('/:id', async (c) => {
    const agent = await agentService.getAgentById(c.req.param('id'));
    return c.json(agent);
  })
  .post('/', zValidator('json', CreateAgentSchema), async (c) => {
    const data = c.req.valid('json');
    const agent = await agentService.createAgent(data);
    return c.json(agent, 201);
  })
  .put('/:id', zValidator('json', UpdateAgentSchema), async (c) => {
    const agent = await agentService.updateAgent(c.req.param('id'), c.req.valid('json'));
    return c.json(agent);
  })
  .delete('/:id', async (c) => {
    await agentService.deleteAgent(c.req.param('id'));
    return c.body(null, 204);
  });
```

## Rules

- Routes contain ZERO business logic. Validate, call service, return.
- Use `zValidator` middleware for request body validation with shared Zod schemas.
- Use method chaining on Hono instance (`.get().post().put()`).
- Return appropriate HTTP status codes: 200 (ok), 201 (created), 204 (deleted), 404 (not found), 400 (validation).
- One route file per entity. Keep them short.
- Mount all routes in `routes/index.ts` with prefixes.

## Error Handling

Use a global error handler middleware, not per-route try-catch:

```typescript
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.message }, err.status ?? 500);
  }
  return c.json({ error: 'Internal server error' }, 500);
});
```
