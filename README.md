# Atlas

AI agent management platform for orchestrating coding agents, tracking tasks, and managing project knowledge.

## Architecture

Monorepo with three packages:

```
packages/
  shared/   # Zod schemas, TypeScript types, constants
  server/   # Hono REST API + MCP server + Drizzle SQLite
  client/   # React SPA (Vite + Tailwind + shadcn/ui)
data/
  agents.db # SQLite database (gitignored)
```

**Server layers:** Routes (thin HTTP) -> Controllers (delegation) -> Services (business logic) -> Repositories (data access) -> Drizzle/SQLite

**MCP tools** share the same service layer, providing IDE integration via the Model Context Protocol.

## Prerequisites

- Node.js >= 24 (see `.nvmrc`)
- pnpm

## Setup

```bash
nvm use           # switches to Node 24
pnpm install      # installs all workspace dependencies
```

## Development

```bash
pnpm dev          # runs shared (watch) + server + client concurrently
pnpm dev:server   # server only
pnpm dev:client   # client only
```

The server runs on `http://localhost:3100` and the client on `http://localhost:5173`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all packages in dev mode |
| `pnpm build` | Build all packages |
| `pnpm lint` | Run Biome linter |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm format` | Format all files with Biome |
| `pnpm typecheck` | Run TypeScript type-checking across all packages |
| `pnpm mcp` | Start the MCP server (stdio) |
| `pnpm db:generate` | Generate Drizzle migrations from schema changes |
| `pnpm db:migrate` | Run pending database migrations |

## MCP Integration

The server exposes an MCP server for IDE integration (Claude Code, Cursor, etc.):

```bash
pnpm mcp
```

Tools available: task management, memory/knowledge, skills, rules, project context, search, and more.
