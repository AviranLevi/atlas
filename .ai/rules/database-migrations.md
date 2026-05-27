# Database Migrations

> Applies to: all files. Always active.

## Creating Migrations

**NEVER hand-write SQL migration files.** Always use Drizzle Kit:

1. Modify the Drizzle schema file(s) in `packages/server/src/db/schema/`
2. Run `pnpm --filter @atlas/server db:generate`
3. Review the generated `.sql` file and snapshot in `src/db/migrations/`
4. Update the shared Zod schema to match

Drizzle Kit produces correctly formatted SQL with:
- Backtick-quoted identifiers
- `--> statement-breakpoint` separators between statements
- Snapshot JSON files for migration tracking

## Migration Format Requirements

- Every `.sql` file with multiple statements **must** have `--> statement-breakpoint` between them
- Identifiers should use backtick quoting (`` `table_name` ``)
- Run `pnpm --filter @atlas/server db:validate` to verify all migration files

## Runtime Behavior

- Migrations run automatically on server startup via `migrate()` in `db/index.ts`
- If a migration fails, the server exits with a clear error message
- The `schema-patches.ts` file handles idempotent column additions for edge cases
- Migration state is tracked in SQLite's `__drizzle_migrations` table

## Adding New Tables

1. Create `packages/server/src/db/schema/{name}.schema.ts`
2. Export from `packages/server/src/db/schema/index.ts`
3. Run `pnpm --filter @atlas/server db:generate`
4. Create matching Zod schema in `packages/shared/src/schemas/{name}.schema.ts`
5. Export from `packages/shared/src/index.ts`
