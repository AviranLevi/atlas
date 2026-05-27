# Database & Repositories

> Applies to: `packages/server/src/db/**/*.ts`

## Schema Definitions

Drizzle schemas are split one-per-entity in `packages/server/src/db/schema/`. Each file exports one `sqliteTable`. A barrel `index.ts` re-exports all tables plus relations.

```
packages/server/src/db/
  schema/
    agents.schema.ts
    skills.schema.ts
    rules.schema.ts
    memory.schema.ts
    tasks.schema.ts
    projects.schema.ts
    settings.schema.ts
    relations.schema.ts   # Drizzle relations for all junction tables
    index.ts              # Barrel re-export
  helpers/
    index.ts              # uuidDefault(), timestampDefault() shared by all schemas
  repositories/
    ...
```

```typescript
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuidDefault, timestampDefault } from '../helpers/index.js';

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  name: text('name').notNull(),
  description: text('description'),
  personality: text('personality'),
  unbreakableRules: text('unbreakable_rules'),
  createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
  updatedAt: text('updated_at').notNull().$defaultFn(timestampDefault),
});
```

## Rules

- Table names: `snake_case` plural (`agents`, `agent_skills`).
- Column names: `snake_case` in DB, `camelCase` in Drizzle schema field names.
- All tables have `id` (UUID text), `created_at`, `updated_at`.
- Use `text` for UUIDs and ISO timestamps (SQLite has no native UUID/datetime).
- Junction tables for many-to-many: `entity1_entity2` with composite references.
- Foreign keys use `.references(() => otherTable.id)`.

## Repository Pattern

Repositories live in `packages/server/src/db/repositories/`. One per entity.

```typescript
const FILE_PATH = 'db/repositories/agents.repository.ts';

export class AgentRepository {
  constructor(private readonly db: BetterSQLite3Database) {}

  /**
   * Finds all agents, optionally with related skills.
   * @param filters - Optional query filters.
   */
  async findAll(filters?: ListAgentsFilters): Promise<Agent[]> {
    const FUNCTION_NAME = 'findAll';
    try {
      return this.db.select().from(agents).all();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agents', { cause: error });
    }
  }
}
```

## Repository Method Naming

- `findAll(filters?)` -- query multiple rows
- `findById(id)` -- query single row, return `null` if not found
- `findByIdOrThrow(id)` -- query single row, throw if not found
- `insert(data)` -- insert and return created row
- `update(id, data)` -- partial update, return updated row
- `remove(id)` -- delete row

## Migrations

- Run `npx drizzle-kit generate` after schema changes.
- Migration files are committed to git.
- Apply via `npx drizzle-kit migrate` or programmatically on server start.
