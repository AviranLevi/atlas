# Services and Repositories — Detailed Reference

## Service File Template

```typescript
// External
import { eq } from 'drizzle-orm';

// Shared
import type { X, CreateX, UpdateX } from '@my-agents/shared';

// DB
import { db } from '../db/index.js';
import { someTable } from '../db/schema/index.js';

// Repositories
import { xsRepository } from '../db/repositories/index.js';

// Lib
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';

const FILE_PATH = 'services/xs.service.ts';

export class XsService {
  constructor(private readonly repo = xsRepository) {}

  /** Lists all Xs. */
  async list(): Promise<X[]> {
    const FUNCTION_NAME = 'list';
    try {
      return this.repo.findAll();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list Xs', { cause: error });
    }
  }

  /** Returns an X by ID. Throws NotFoundError if not found. */
  async getById(id: string): Promise<X> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get X', { cause: error });
    }
  }

  /** Creates a new X. */
  async create(data: CreateX): Promise<X> {
    const FUNCTION_NAME = 'create';
    try {
      return this.repo.insert(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create X', { cause: error });
    }
  }

  /** Updates an X by ID. */
  async update(id: string, data: UpdateX): Promise<X> {
    const FUNCTION_NAME = 'update';
    try {
      return this.repo.update(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update X', { cause: error });
    }
  }

  /** Deletes an X by ID. */
  async delete(id: string): Promise<void> {
    const FUNCTION_NAME = 'delete';
    try {
      this.repo.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete X', { cause: error });
    }
  }
}
```

## Service Error Handling Pattern

Every service method follows this exact structure:

```typescript
async methodName(args): Promise<ReturnType> {
  const FUNCTION_NAME = 'methodName';
  try {
    // logic here
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Human-readable message', { cause: error });
  }
}
```

Never swallow errors. Always re-throw as `AppError` (or `NotFoundError` for 404s — but `findByIdOrThrow` in repositories already handles that). The `{ cause: error }` preserves the original stack.

## Services Index (`src/services/index.ts`)

All imports at top, all instantiations below:

```typescript
// Services
import { AgentsService } from './agents.service.js';
import { TasksService } from './tasks.service.js';
import { WorkspacesService } from './workspaces.service.js';
// ... all service imports

export const agentsService = new AgentsService();
export const tasksService = new TasksService();
export const workspacesService = new WorkspacesService();
// ... all instantiations
```

Do not split imports and instantiations into two blocks.

## When Services Access `db` Directly

Services should generally delegate to repositories. But it is acceptable for a service to import `db` and query directly when:
- The query requires a complex join across multiple tables
- The logic is orchestration-heavy and does not belong in a single repository method

```typescript
// OK: complex join that would be awkward in the repository
const rows = db
  .select()
  .from(agentProjects)
  .where(eq(agentProjects.projectId, projectId))
  .all();
```

When doing so, add the `// DB` import section to the service file.

---

## Repository File Template

```typescript
// External
import { eq } from 'drizzle-orm';

// Shared
import type { X, CreateX, UpdateX } from '@my-agents/shared';

// DB
import type { DB } from '../index.js';
import { xs } from '../schema/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';

const FILE_PATH = 'db/repositories/xs.repository.ts';

export class XsRepository {
  constructor(private readonly db: DB) {}

  /** Returns all Xs. */
  findAll(): X[] {
    const FUNCTION_NAME = 'findAll';
    try {
      return this.db.select().from(xs).all() as X[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query Xs', { cause: error });
    }
  }

  /** Returns an X by ID, or null if not found. */
  findById(id: string): X | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(xs).where(eq(xs.id, id)).get();
      return (row as X) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query X', { cause: error });
    }
  }

  /** Returns an X by ID, or throws NotFoundError. */
  findByIdOrThrow(id: string): X {
    const row = this.findById(id);
    if (!row) throw new NotFoundError('X', id);
    return row;
  }

  /** Inserts a new X and returns the created record. */
  insert(data: CreateX): X {
    const FUNCTION_NAME = 'insert';
    try {
      return this.db.insert(xs).values(data).returning().get() as X;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert X', { cause: error });
    }
  }

  /** Updates an X and returns the updated record. */
  update(id: string, data: UpdateX): X {
    const FUNCTION_NAME = 'update';
    try {
      return this.db
        .update(xs)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(xs.id, id))
        .returning()
        .get() as X;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update X', { cause: error });
    }
  }

  /** Deletes an X by ID. */
  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(xs).where(eq(xs.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete X', { cause: error });
    }
  }
}
```

## Standard Repository Method Names

| Operation                    | Method name           |
|------------------------------|-----------------------|
| Get all records              | `findAll()`           |
| Get by primary key           | `findById(id)`        |
| Get by primary key or throw  | `findByIdOrThrow(id)` |
| Get by a single field        | `findByStatus(status)` / `findByTaskId(taskId)` |
| Get with multiple filters    | `findByFilters(filters)` |
| Insert and return            | `insert(data)`        |
| Update and return            | `update(id, data)`    |
| Delete by primary key        | `remove(id)`          |
| Delete by foreign key        | `removeByTaskId(taskId)` |

## Repositories Index (`src/db/repositories/index.ts`)

Repositories are instantiated once and exported:

```typescript
// DB
import { db } from '../index.js';

// Repositories
import { AgentsRepository } from './agents.repository.js';
import { TasksRepository } from './tasks.repository.js';
// ...

export const agentsRepository = new AgentsRepository(db);
export const tasksRepository = new TasksRepository(db);
// ...
```

## Enriching Rows with Joined Data

When a repository query does a `leftJoin`, use a private `enrichRow` helper:

```typescript
private enrichRow(row: {
  workspaces: Workspace;
  tasks: { name: string } | null;
  projects: { name: string } | null;
}): Workspace {
  return {
    ...row.workspaces,
    taskName: row.tasks?.name ?? undefined,
    projectName: row.projects?.name ?? undefined,
  };
}

/** Returns all workspaces enriched with task and project names. */
findAll(): Workspace[] {
  const rows = this.db
    .select()
    .from(workspaces)
    .leftJoin(tasks, eq(workspaces.taskId, tasks.id))
    .leftJoin(projects, eq(workspaces.projectId, projects.id))
    .all();
  return rows.map((r) => this.enrichRow(r as any));
}
```

## JSON Fields

SQLite stores JSON as text. Parse on read, stringify on write:

```typescript
// Parse on read
function parseTags(row: unknown): Task {
  const r = row as Record<string, unknown>;
  return {
    ...r,
    tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags ?? null,
  } as Task;
}

// Stringify on write (in insert/update)
const values = { ...rest, tags: tags ? JSON.stringify(tags) : null };
```
