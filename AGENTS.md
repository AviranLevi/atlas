# AGENTS.md — Atlas

> Instructions for AI coding agents working on this repository.

## Project overview

Atlas is a local-first AI agent orchestration platform — a monorepo with three packages:

| Package | Stack | Port |
|---------|-------|------|
| `packages/server` | Hono + Node.js + Drizzle ORM + SQLite | 3100 |
| `packages/client` | React 19 + Vite + Tailwind CSS 4 + shadcn/ui | 5173 |
| `packages/shared` | Zod schemas + TypeScript types (shared) | — |

Package scope prefix: `@atlas/*`. Package manager: **pnpm** (workspace protocol `workspace:*`). Node.js >= 24.

## Commands

```bash
pnpm dev          # start all packages (shared → server → client)
pnpm build        # full production build
pnpm lint         # Biome linter
pnpm lint:fix     # auto-fix lint issues
pnpm format       # format all files
pnpm typecheck    # TypeScript type-checking across all packages
pnpm test         # run Vitest test suite
pnpm db:generate  # generate Drizzle migration from schema changes
pnpm db:migrate   # apply pending migrations
```

## Architecture

```
Routes (thin HTTP + zValidator) → Controllers (delegation) → Services (business logic) → Repositories (data access) → Drizzle/SQLite
MCP Tools (stdio/SSE on port 3101) ──────────────────────────────────────┘
```

- **Routes**: request validation only — no business logic.
- **Controllers**: extract validated params, delegate to services, format HTTP responses.
- **Services**: all business logic. Each service lives in its own subfolder under `packages/server/src/services/` with a `.types.ts` file.
- **Repositories**: single-table data access. No cross-entity logic.
- **MCP Tools**: defined in `packages/server/src/mcp/`. Zod-validated input, delegates to services. These are consumed by **external AI agents** — not by the React client. Do not treat MCP endpoints as dead code.

## Coding standards

### TypeScript
- No `any` — use `unknown` with type narrowing
- Explicit return types on all exported functions
- Prefer `type` over `interface` unless extending is needed
- All IDs are UUIDs (`crypto.randomUUID()`)

### Naming conventions
- Files: `kebab-case` (e.g., `agents.service.ts`, `workspaces.page.tsx`)
- Classes/Types/Interfaces: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE` for true constants, `camelCase` for config objects
- Zod schemas: `PascalCase` ending with `Schema`
- Database tables: `snake_case` plural

### Server
- Service files: `*.service.ts`, type files: `*.types.ts`, route files: `*.route.ts`
- Use `AppError` for structured error handling in services
- Migrations live in `packages/server/src/db/migrations/` with `--> statement-breakpoint` separators

### Client
- Pages use `.page.tsx` suffix; sub-components in a `components/` subfolder
- Types in `.types.ts`, constants in `.constants.ts`
- All data fetching via TanStack Query hooks in `packages/client/src/hooks/`
- Dynamic Tailwind classes use `cn()` (clsx + tailwind-merge) — do not flag dynamically composed classes as unused

### Formatting
- Biome (not ESLint/Prettier): `indentStyle: space`, `indentWidth: 2`, `lineWidth: 120`
- Single quotes, trailing commas, semicolons always

## Important context

- Atlas exposes two MCP servers: **stdio** (`mcp.ts`) and **HTTP/SSE** (`mcp-http.ts` on port 3101). MCP tool files in `packages/server/src/mcp/` are actively consumed by external agents — they are not called by the React client.
- The server uses **worktrees** (`packages/server/src/services/worktree/`) to create isolated git environments for agent task runs. These shell out to `git` — be careful with path handling and injection.
- The `packages/shared` barrel export (`src/index.ts`) re-exports schemas used by both server and client. Some exports may only be consumed on one side — this is expected, not dead code.
- SSE/WebSocket endpoints for workspace streaming are connected from the client via `EventSource`, not standard REST calls. They will not appear in typical `fetch`/`axios` import searches.

## Rules

Detailed coding rules live in `.ai/rules/`. Each file covers one topic:

| Rule | Scope |
|------|-------|
| `project-structure.md` | Monorepo layout, naming, architecture layers |
| `services.md` | Service layer patterns, error handling |
| `routes.md` | Hono route patterns, HTTP conventions |
| `db-schema.md` | Drizzle schema definitions, repository pattern |
| `database-migrations.md` | Migration workflow (never hand-write SQL) |
| `components.md` | React component structure, styling, props |
| `client-organization.md` | Client-side file organization (types, constants) |
| `hooks.md` | TanStack Query patterns, custom hooks |
| `imports.md` | Import ordering and grouping |
| `shared-schemas.md` | Zod schema conventions, type inference |
| `mcp.md` | MCP tool layer patterns |
| `testing.md` | Vitest conventions, mocks, factories |

Read these rules before making changes to the corresponding areas.

## Additional documentation

- `CONTRIBUTING.md` — full setup guide and workflow
- `DESIGN.md` — complete design system (colors, typography, components, spacing)
- `MEMORIES.md` — detailed architecture, database schema, and project history
