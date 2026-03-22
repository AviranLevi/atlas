---
name: server-conventions
description: This skill should be used when the user asks to "add a route", "create a controller", "add a service method", "create a repository method", "write server code", "add an endpoint", "add a handler", "follow server conventions", or when writing or modifying any file inside packages/server/src/. Provides the complete coding conventions for the my-agents server: route/controller/service/repository structure, import section ordering, and JSDoc requirements.
version: 1.0.0
---

# Server Coding Conventions — my-agents

This skill governs all code written in `packages/server/src/`. Apply these rules whenever creating or editing routes, controllers, services, repositories, or lib utilities.

## Layer Architecture

The server follows a strict 4-layer architecture. Each layer has a single responsibility:

```
Route file       → declares paths + validators only
Controller file  → reads request, calls service, returns response
Service file     → business logic, orchestrates repositories
Repository file  → raw DB queries via Drizzle ORM
```

Never skip layers. Controllers never import `db` or schema tables. Routes never contain logic.

---

## Routes (`src/routes/`)

Route files are thin. Each file creates one `Hono` instance and chains `.get()` / `.post()` / `.put()` / `.delete()` calls. No logic goes here.

```typescript
// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { CreateAgentSchema, UpdateAgentSchema } from '@my-agents/shared';

// Controllers
import { listAgents, getAgent, createAgent, updateAgent, deleteAgent } from '../controllers/agents.controller.js';

export const agentsRoute = new Hono()
  .get('/', listAgents)
  .get('/:id', getAgent)
  .post('/', zValidator('json', CreateAgentSchema), createAgent)
  .put('/:id', zValidator('json', UpdateAgentSchema), updateAgent)
  .delete('/:id', deleteAgent);
```

**Rules:**
- `zValidator('json', Schema)` goes on the route, not the controller
- No logic, no imports of `db`, no service calls
- Use `.js` extension on all local imports

---

## Controllers (`src/controllers/`)

Each route file has a matching controller file. Controllers read from the request, call one service method, and return the response.

```typescript
// External
import type { Context } from 'hono';

// Shared
import type { CreateAgent, UpdateAgent } from '@my-agents/shared';

// Services
import { agentsService } from '../services/index.js';

/** Lists all agents. */
export async function listAgents(c: Context) {
  const agents = await agentsService.list();
  return c.json(agents);
}

/** Returns an agent by ID. */
export async function getAgent(c: Context) {
  const agent = await agentsService.getById(c.req.param('id')!);
  return c.json(agent);
}

/** Creates a new agent. */
export async function createAgent(c: Context) {
  const data = (c.req as any).valid('json') as CreateAgent;
  const agent = await agentsService.create(data);
  return c.json(agent, 201);
}

/** Updates an agent by ID. */
export async function updateAgent(c: Context) {
  const agent = await agentsService.update(
    c.req.param('id')!,
    (c.req as any).valid('json') as UpdateAgent,
  );
  return c.json(agent);
}

/** Deletes an agent by ID. */
export async function deleteAgent(c: Context) {
  await agentsService.delete(c.req.param('id')!);
  return c.body(null, 204);
}
```

**Key patterns:**
- Always `import type { Context } from 'hono'` (bare `Context`, no generics)
- Route params: `c.req.param('id')!` — non-null assertion required on bare `Context`
- Validated body: `(c.req as any).valid('json') as MyType` — cast required on bare `Context`
- DELETE returns `c.body(null, 204)`
- POST returns `c.json(result, 201)`
- Each function has a single-line JSDoc: `/** Short description. */`

**Naming convention:**

| HTTP Method | Pattern            | Example           |
|-------------|-------------------|-------------------|
| GET /       | `list{Resource}`   | `listAgents`      |
| GET /:id    | `get{Resource}`    | `getAgent`        |
| POST /      | `create{Resource}` | `createAgent`     |
| PUT /:id    | `update{Resource}` | `updateAgent`     |
| DELETE /:id | `delete{Resource}` | `deleteAgent`     |
| Custom      | `{verb}{Resource}` | `mergeWorkspace`  |

**Controller index barrel** (`src/controllers/index.ts`):
```typescript
export * from './agents.controller.js';
// one line per controller file
```

---

## Services (`src/services/`)

Services contain business logic. They receive plain data, call repositories (or other services), and return typed results.

```typescript
// External
import { eq } from 'drizzle-orm';

// Shared
import type { Agent, CreateAgent, UpdateAgent } from '@my-agents/shared';

// DB
import { db } from '../db/index.js';
import { agentProjects } from '../db/schema/index.js';

// Repositories
import { agentsRepository } from '../db/repositories/index.js';

// Lib
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';

const FILE_PATH = 'services/agents.service.ts';

export class AgentsService {
  constructor(private readonly repo = agentsRepository) {}

  /** Retrieves all agents. */
  async list(): Promise<Agent[]> {
    const FUNCTION_NAME = 'list';
    try {
      return this.repo.findAll();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list agents', { cause: error });
    }
  }
}
```

**Rules:**
- `const FILE_PATH = 'services/name.service.ts'` at module top
- `const FUNCTION_NAME = 'methodName'` inside each method
- Every method: `try/catch` → `logger.error` → `throw new AppError(..., { cause: error })`
- Services may import `db` directly for complex joins not worth putting in a repository method
- Every method has a JSDoc comment

---

## Repositories (`src/db/repositories/`)

Repositories are pure DB access. They use Drizzle ORM and return typed results.

```typescript
// External
import { eq } from 'drizzle-orm';

// Shared
import type { Agent, CreateAgent, UpdateAgent } from '@my-agents/shared';

// DB
import type { DB } from '../index.js';
import { agents } from '../schema/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';

const FILE_PATH = 'db/repositories/agents.repository.ts';

export class AgentsRepository {
  constructor(private readonly db: DB) {}

  /** Returns all agents. */
  findAll(): Agent[] { ... }

  /** Returns an agent by ID, or null if not found. */
  findById(id: string): Agent | null { ... }

  /** Returns an agent by ID, or throws NotFoundError. */
  findByIdOrThrow(id: string): Agent { ... }

  /** Inserts a new agent and returns the created record. */
  insert(data: CreateAgent): Agent { ... }

  /** Updates an agent and returns the updated record. */
  update(id: string, data: UpdateAgent): Agent { ... }

  /** Deletes an agent by ID. */
  remove(id: string): void { ... }
}
```

**Standard method names:** `findAll`, `findById`, `findByIdOrThrow`, `findByStatus`, `findByFilters`, `insert`, `update`, `remove`, `removeByX`

---

## Import Section Order

Every file uses section comments. Include only sections that apply — omit empty ones. Order is always:

```typescript
// External       ← npm packages (hono, drizzle-orm, zod, etc.)
// Shared         ← @my-agents/shared types and schemas
// Controllers    ← ../controllers/*.controller.js  (route files only)
// Services       ← ../services/index.js  (controller/route files)
// DB             ← ../db/index.js and ../db/schema/index.js
// Repositories   ← ../db/repositories/index.js
// Executors      ← ../executors/*.js  (if applicable)
// Lib            ← ../lib/*.js (logger, errors, etc.)
```

`type` imports go inside the relevant section, grouped at the bottom of that section. `// External` is always first. `// Lib` is always last. Never use `// Types` as a standalone section.

---

## JSDoc

Every exported function and every class method gets a single-line JSDoc. No multi-line blocks for simple descriptions. Use the `@param` tag only for complex or non-obvious parameters.

```typescript
/** Lists all agents. */
export async function listAgents(c: Context) { ... }

/** Returns an agent by ID. */
findById(id: string): Agent | null { ... }

/** Merges the workspace branch into the project's base branch and marks it completed. */
export async function mergeWorkspace(c: Context) { ... }
```

Do not add JSDoc to private helpers that are obviously named (e.g., `enrichRow`, `parseComments`).

---

## Additional Resources

For detailed patterns and full examples, consult the reference files:

- **`references/routes-and-controllers.md`** — Complete route/controller examples, edge cases, custom handlers
- **`references/services-and-repositories.md`** — Service error handling, repository patterns, complex queries
- **`references/imports-and-jsdoc.md`** — Full import ordering rules, JSDoc examples, edge cases
