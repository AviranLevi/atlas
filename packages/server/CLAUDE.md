# Server Coding Conventions

All code in `packages/server/src/` must follow these rules. These apply to every new file and every edit.

## Layer Architecture

```
Route file    → paths + validators only (no logic)
Controller    → read request, call service, return response
Service       → business logic, orchestrate repositories
Repository    → raw Drizzle ORM queries
```

- Controllers never import `db` or schema tables
- Routes never contain logic or direct data access
- Cross-controller shared logic goes in `src/lib/`

## Routes

Thin. Only paths, `zValidator` middleware, and controller imports.

```typescript
export const agentsRoute = new Hono()
  .get('/', listAgents)
  .get('/:id', getAgent)
  .post('/', zValidator('json', CreateAgentSchema), createAgent)
  .put('/:id', zValidator('json', UpdateAgentSchema), updateAgent)
  .delete('/:id', deleteAgent);
```

## Controllers

```typescript
import type { Context } from 'hono';              // bare Context, no generics
import type { CreateAgent } from '@my-agents/shared';
import { agentsService } from '../services/index.js';

/** Lists all agents. */
export async function listAgents(c: Context) {
  return c.json(await agentsService.list());
}

/** Returns an agent by ID. */
export async function getAgent(c: Context) {
  return c.json(await agentsService.getById(c.req.param('id')!));  // note: ! required
}

/** Creates a new agent. */
export async function createAgent(c: Context) {
  const data = (c.req as any).valid('json') as CreateAgent;        // note: cast required
  return c.json(await agentsService.create(data), 201);
}

/** Deletes an agent by ID. */
export async function deleteAgent(c: Context) {
  await agentsService.delete(c.req.param('id')!);
  return c.body(null, 204);
}
```

Naming: `list{X}`, `get{X}`, `create{X}`, `update{X}`, `delete{X}`, `{verb}{X}` for custom actions.

## Services

```typescript
const FILE_PATH = 'services/xs.service.ts';

async list(): Promise<X[]> {
  const FUNCTION_NAME = 'list';
  try {
    return this.repo.findAll();
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to list Xs', { cause: error });
  }
}
```

Every method: `FILE_PATH` constant + `FUNCTION_NAME` constant + try/catch + logger + rethrow.

## Repositories

Standard method names: `findAll`, `findById`, `findByIdOrThrow`, `findByStatus`, `findByFilters`, `insert`, `update`, `remove`, `removeByX`.

Always call `.set({ ...data, updatedAt: new Date().toISOString() })` in `update`.

## Import Order

Use section comments. Include only sections that apply. Always `// External` first, `// Lib` last.

```typescript
// External
// Shared
// Controllers    ← route files only
// Services       ← controller files
// DB             ← db instance + schema tables
// Repositories   ← service files
// Executors      ← if applicable
// Lib
```

`type` imports go inside the relevant section (not a separate `// Types` section).
Always use `.js` extension on local imports.

## JSDoc

Every exported function and every public method gets a single-line JSDoc:

```typescript
/** Lists all agents. */
/** Returns an agent by ID, or null if not found. */
/** Inserts a new agent and returns the created record. */
```

No JSDoc on private helpers, barrel index re-exports, or internal constants.
