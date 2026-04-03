# Contributing to Atlas

Thanks for your interest in contributing to Atlas! This guide will help you get started.

## Prerequisites

- **Node.js >= 24** (see `.nvmrc`)
- **pnpm** (package manager)

## Setup

```bash
git clone https://github.com/AviranLevi/atlas.git
cd atlas
nvm use
pnpm install
pnpm dev
```

The server runs on `http://localhost:3100` and the client on `http://localhost:5173`.

## Project Structure

Atlas is a monorepo with three packages:

- `packages/shared` — Zod schemas and TypeScript types shared between server and client
- `packages/server` — Hono REST API + MCP server + Drizzle SQLite
- `packages/client` — React SPA (Vite + Tailwind + shadcn/ui)

See `MEMORIES.md` for detailed architecture documentation.

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run checks before submitting:

```bash
pnpm lint        # Biome linter
pnpm typecheck   # TypeScript type-checking
pnpm build       # Full build (shared -> server -> client)
pnpm test        # Run tests
```

4. Open a pull request

## Coding Standards

### General

- No `any` — use `unknown` with type narrowing
- Explicit return types on all exported functions
- Prefer `type` over `interface` unless extending is needed
- All IDs are UUIDs (`crypto.randomUUID()`)

### Naming Conventions

- Files: `kebab-case` (e.g., `agents.service.ts`, `workspaces.page.tsx`)
- Classes/Types/Interfaces: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE` for true constants, `camelCase` for config objects
- Zod schemas: `PascalCase` ending with `Schema`
- Database tables: `snake_case` plural

### Server Architecture

```
Routes (thin HTTP + zValidator) -> Controllers (delegation) -> Services (business logic) -> Repositories (data access)
```

- **Routes**: request validation only, no business logic
- **Controllers**: extract validated params, delegate to services, format responses
- **Services**: all business logic, structured error handling with `AppError`
- **Repositories**: single-table data access, no cross-entity logic

### Client Architecture

- Pages use `.page.tsx` suffix, sub-components live in a `components/` subfolder
- Types in `.types.ts`, constants in `.constants.ts`
- All data fetching via TanStack Query hooks in `hooks/`
- Import sections: `// React / library`, `// Components`, `// Hooks`, `// Types`, `// Constants`

### Formatting

Atlas uses [Biome](https://biomejs.dev/) for linting and formatting:

```bash
pnpm lint        # check
pnpm lint:fix    # auto-fix
pnpm format      # format all files
```

## Database Migrations

Schema changes require a Drizzle migration:

```bash
pnpm db:generate   # generate migration from schema changes
pnpm db:migrate    # apply pending migrations
```

Migration SQL files live in `packages/server/src/db/migrations/`. Each migration must use `--> statement-breakpoint` separators between statements.
