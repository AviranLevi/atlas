# Import Organization and JSDoc — Detailed Reference

## Import Section Order

All files use labeled section comments. Use only the sections that apply — omit any empty sections entirely.

```
// External       ← npm packages
// Shared         ← @my-agents/shared
// Controllers    ← ../controllers/  (route files only)
// Services       ← ../services/index.js
// DB             ← ../db/index.js and ../db/schema/index.js
// Repositories   ← ../db/repositories/index.js
// Executors      ← ../executors/*.js
// Lib            ← ../lib/*.js
```

`// External` is always first. `// Lib` is always last.

---

## Section-by-Section Rules

### `// External`

Third-party npm packages. Includes type-only imports from npm packages.

```typescript
// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { streamSSE } from 'hono/streaming';
import { eq, and, or, isNull } from 'drizzle-orm';
import type { Context } from 'hono';
```

### `// Shared`

Imports from the `@my-agents/shared` workspace package (Zod schemas and TypeScript types).

```typescript
// Shared
import { CreateAgentSchema, UpdateAgentSchema } from '@my-agents/shared';
import type { Agent, CreateAgent, UpdateAgent } from '@my-agents/shared';
```

Type imports go at the bottom of the section, not in a separate `// Types` block.

### `// Controllers`

Only used in route files. Import all handler functions from the controller.

```typescript
// Controllers
import {
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
} from '../controllers/agents.controller.js';
```

### `// Services`

Used in controller files (and occasionally route files with middleware). Always import from the barrel index.

```typescript
// Services
import { agentsService, tasksService } from '../services/index.js';
```

### `// DB`

Raw Drizzle `db` instance and schema tables. Used in service files that need complex joins, and in repository files.

```typescript
// DB
import { db } from '../db/index.js';
import { agents, agentSkills, agentRules } from '../db/schema/index.js';
```

For repositories, also import the `DB` type:

```typescript
// DB
import type { DB } from '../index.js';
import { agents } from '../schema/index.js';
```

### `// Repositories`

Used in service files. Always import from the barrel index.

```typescript
// Repositories
import { agentsRepository } from '../db/repositories/index.js';
```

### `// Executors`

Used in service files that spawn processes (e.g., running Claude agents).

```typescript
// Executors
import { claudeExecutor } from '../executors/claude.executor.js';
```

### `// Lib`

Internal utilities: logger, errors, helpers.

```typescript
// Lib
import { logger } from '../lib/logger.js';
import { AppError, NotFoundError } from '../lib/errors.js';
import { detectTechStack } from '../lib/filesystem-scanner.js';
```

---

## Common Import Patterns by File Type

### Route file
```
// External  (Hono, zValidator)
// Shared    (Zod schemas)
// Controllers
```

### Controller file
```
// External  (Context type from hono)
// Shared    (TypeScript types)
// Services
```

### Service file
```
// External  (drizzle operators, if needed)
// Shared    (TypeScript types)
// DB        (only if complex queries needed directly)
// Repositories
// Lib       (logger, AppError)
```

### Repository file
```
// External  (drizzle operators)
// Shared    (TypeScript types)
// DB        (DB type + schema tables)
// Lib       (logger, AppError, NotFoundError)
```

### Lib utility file
```
// External  (any npm deps)
// Lib       (logger, errors — if needed)
```

---

## JSDoc Rules

### When to add JSDoc

Add a single-line JSDoc to:
- Every exported function
- Every public class method (including repository and service methods)

Do **not** add JSDoc to:
- Private class methods with self-evident names (e.g., `enrichRow`, `parseComments`)
- Internal constants like `FILE_PATH` or `FUNCTION_NAME`
- Simple re-exports in barrel index files

### Format

Always use `/** single line */` for short descriptions. No blank `/**` lines, no `@returns` for obvious return types.

```typescript
/** Lists all agents. */
export async function listAgents(c: Context) { ... }

/** Returns an agent by ID. */
findById(id: string): Agent | null { ... }

/** Returns an agent by ID, or throws NotFoundError. */
findByIdOrThrow(id: string): Agent { ... }

/** Inserts a new agent and returns the created record. */
insert(data: CreateAgent): Agent { ... }

/** Creates a workspace, starts the agent process, and returns the result. */
async createAndStart(taskId: string, options: StartOptions): Promise<Workspace> { ... }
```

### Multi-line JSDoc (use sparingly)

Only use multi-line when the function has genuinely complex behavior or non-obvious parameters:

```typescript
/**
 * Returns the full context for an agent: profile, global instructions,
 * assigned skills/rules, and agent-scoped memories.
 * When projectId is provided, also returns project-scoped skills and rules.
 */
async getContext(agentId: string, projectId?: string) { ... }
```

### JSDoc for class-level (avoid)

Do not add class-level JSDoc. The class name and its methods are self-documenting.

---

## Banned Patterns

These patterns exist in older code and must not be introduced in new files:

| Banned                        | Correct alternative                     |
|-------------------------------|-----------------------------------------|
| `// NPM` section label        | `// External`                           |
| `// Utils` section label      | `// Lib`                                |
| `// Types` section            | Merge into relevant section (`// Shared`, `// External`) |
| `import ... from 'hono'` with handler generics | Use bare `Context`, add `!` and `as any` casts |
| Raw `db` import in controller | Delegate to service                     |
| Raw `db` import in route file | Delegate to service                     |
| Inline handler in route file  | Extract to controller function          |
| Missing `.js` extension       | Always include `.js` on local imports   |
