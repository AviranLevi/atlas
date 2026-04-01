# Atlas

[![CI](https://github.com/YOUR_USERNAME/atlas/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/atlas/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

AI agent management platform for orchestrating coding agents, tracking tasks, and managing project knowledge.

## Features

- **Agent Orchestration** — manage multiple AI coding agents across projects
- **Task Management** — Kanban board with automatic status transitions and code review workflow
- **MCP Integration** — agents connect via the Model Context Protocol (Cursor, Claude Code, etc.)
- **Project Knowledge** — rules, skills, memory entries, and phase tracking
- **Chat Interface** — conversational interface with tool access to project data
- **Package System** — export/import agents, skills, and rules as portable JSON packages

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

**Server layers:** Routes (thin HTTP) → Controllers (delegation) → Services (business logic) → Repositories (data access) → Drizzle/SQLite

**MCP tools** share the same service layer, providing IDE integration via the Model Context Protocol.

See `MEMORIES.md` for detailed architecture documentation.

## Prerequisites

- Node.js >= 24 (see `.nvmrc`)
- pnpm

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/atlas.git
cd atlas
nvm use           # switches to Node 24
pnpm install      # installs all workspace dependencies
```

### Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3100` | Server HTTP port |
| `MCP_PORT` | `3101` | MCP HTTP/SSE server port |

All variables are optional — sensible defaults are used when unset.

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
| `pnpm test` | Run tests |
| `pnpm mcp` | Start the MCP server (stdio) |
| `pnpm db:generate` | Generate Drizzle migrations from schema changes |
| `pnpm db:migrate` | Run pending database migrations |

## MCP Integration

The server exposes an MCP server for IDE integration (Claude Code, Cursor, etc.):

```bash
pnpm mcp
```

Tools available: task management, memory/knowledge, skills, rules, project context, search, and more.

The MCP HTTP/SSE server runs on port 3101 for browser and network-based clients. Connection details are available in the Settings page.

## Security Note

By default, the server allows CORS from all origins for local development. If you deploy Atlas on a network, configure CORS appropriately for your environment.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and PR workflow.

## License

[MIT](LICENSE)
