# Routes and Controllers — Detailed Reference

## Route File Template

```typescript
// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { CreateXSchema, UpdateXSchema } from '@my-agents/shared';

// Controllers
import {
  listXs,
  getX,
  createX,
  updateX,
  deleteX,
  customAction,
} from '../controllers/xs.controller.js';

export const xsRoute = new Hono()
  .get('/', listXs)
  .get('/:id', getX)
  .post('/', zValidator('json', CreateXSchema), createX)
  .put('/:id', zValidator('json', UpdateXSchema), updateX)
  .delete('/:id', deleteX)
  .post('/:id/custom-action', customAction);
```

Rules:
- `zValidator` middleware goes on the route line, before the controller
- No inline handler functions — everything is imported from the controller file
- No imports of `db`, schema, or service files in route files
- Route file name: `{resource}.route.ts` (kebab-case plural)

## Controller File Template

```typescript
// External
import type { Context } from 'hono';

// Shared
import type { CreateX, UpdateX } from '@my-agents/shared';

// Services
import { xsService } from '../services/index.js';

/** Lists all Xs. */
export async function listXs(c: Context) {
  const xs = await xsService.list();
  return c.json(xs);
}

/** Returns an X by ID. */
export async function getX(c: Context) {
  const x = await xsService.getById(c.req.param('id')!);
  return c.json(x);
}

/** Creates a new X. */
export async function createX(c: Context) {
  const data = (c.req as any).valid('json') as CreateX;
  const x = await xsService.create(data);
  return c.json(x, 201);
}

/** Updates an X by ID. */
export async function updateX(c: Context) {
  const x = await xsService.update(
    c.req.param('id')!,
    (c.req as any).valid('json') as UpdateX,
  );
  return c.json(x);
}

/** Deletes an X by ID. */
export async function deleteX(c: Context) {
  await xsService.delete(c.req.param('id')!);
  return c.body(null, 204);
}
```

## Reading Request Data

### Route parameters
```typescript
// Always use non-null assertion — param is guaranteed by the route match
const id = c.req.param('id')!;
const workspaceId = c.req.param('workspaceId')!;
```

### Query string
```typescript
const status = c.req.query('status');          // string | undefined
const limit = c.req.query('limit');            // string | undefined
```

### Validated body (after zValidator middleware)
```typescript
const data = (c.req as any).valid('json') as CreateX;
```
The `as any` cast is required because the bare `Context` type does not know about the validated body.
The outer type cast (`as CreateX`) is safe because `zValidator` has already validated and parsed the body.

## Response Patterns

| Scenario               | Response                           |
|------------------------|------------------------------------|
| Return single entity   | `return c.json(entity);`           |
| Return list            | `return c.json(list);`             |
| Created (POST)         | `return c.json(entity, 201);`      |
| No content (DELETE)    | `return c.body(null, 204);`        |
| Streaming (SSE)        | Use `streamSSE` from hono/streaming |

## Custom Action Handlers

For non-CRUD actions (merge, rerun, approve, etc.), name the function `{verb}{Resource}`:

```typescript
/** Merges the workspace branch into the project base branch. */
export async function mergeWorkspace(c: Context) {
  const id = c.req.param('id')!;
  const result = await workspacesService.merge(id);
  return c.json(result);
}

/** Stops a running workspace process. */
export async function stopWorkspace(c: Context) {
  const id = c.req.param('id')!;
  await workspacesService.stop(id);
  return c.body(null, 204);
}

/** Reruns a completed workspace. */
export async function rerunWorkspace(c: Context) {
  const id = c.req.param('id')!;
  const data = (c.req as any).valid('json') as RerunWorkspaceRequest;
  const workspace = await workspacesService.rerun(id, data);
  return c.json(workspace);
}
```

## SSE (Server-Sent Events) Handlers

For streaming responses (real-time output):

```typescript
// External
import { streamSSE } from 'hono/streaming';

/** Streams live output from a workspace process. */
export async function streamWorkspaceOutput(c: Context) {
  const id = c.req.param('id')!;
  return streamSSE(c, async (stream) => {
    // push events via stream.writeSSE({ data, event, id })
    await workspacesService.streamOutput(id, stream);
  });
}
```

## Controller Index Barrel

`src/controllers/index.ts` re-exports every controller:

```typescript
export * from './agents.controller.js';
export * from './agent-providers.controller.js';
export * from './filesystem.controller.js';
export * from './mcp-config.controller.js';
export * from './memory.controller.js';
export * from './phases.controller.js';
export * from './projects.controller.js';
export * from './reviews.controller.js';
export * from './rules.controller.js';
export * from './search.controller.js';
export * from './settings.controller.js';
export * from './skills.controller.js';
export * from './tasks.controller.js';
export * from './workspaces.controller.js';
```

## Cross-Controller Dependencies

Controllers must never import from other controllers. If logic is shared between two controllers (e.g., `deepScanProject` used by both `filesystem.controller.ts` and `projects.controller.ts`), extract it to `src/lib/` as a utility module.

```
src/lib/filesystem-scanner.ts   ← shared utility, imported by multiple controllers
src/lib/git.ts                  ← git helpers
src/lib/errors.ts               ← AppError, NotFoundError
src/lib/logger.ts               ← winston logger instance
```
