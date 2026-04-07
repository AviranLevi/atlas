# Atlas

[![CI](https://github.com/AviranLevi/atlas/actions/workflows/ci.yml/badge.svg)](https://github.com/AviranLevi/atlas/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Atlas is a local-first management hub for AI coding agents. It gives you a single place to track tasks across projects, run agents against those tasks, review their output, and build up a shared knowledge base (rules, skills, memory) that agents can reference via MCP.

<!-- TODO: add screenshot -->

## What it does

You create **tasks** on a Kanban board and assign them to **agents** (Claude Code, Aider, Codex CLI, Gemini CLI, Goose, OpenCode). When you start an agent on a task, Atlas:

1. Creates an isolated git worktree inside your project directory
2. Spawns the agent CLI with your task as the prompt
3. Injects the project's rules, skills, and memory via MCP so the agent has context
4. Moves the task to **In Review** when the agent finishes
5. Presents a review checklist derived from the task's definition of done

You approve or request changes. Approved tasks move to **Done** and the worktree is left for you to merge.

## Supported agents

| Agent | MCP | Install |
|-------|-----|---------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | ✓ | `npm install -g @anthropic-ai/claude-code` |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | ✓ | `npm install -g @google/gemini-cli` |
| [Aider](https://aider.chat) | — | `pip install aider-chat` |
| [OpenAI Codex CLI](https://github.com/openai/codex) | — | `npm install -g @openai/codex` |
| [Amp](https://ampcode.com) | — | `npm install -g @sourcegraph/amp` |
| [Goose](https://github.com/block/goose) | — | see Goose docs |
| [OpenCode](https://github.com/opencode-ai/opencode) | — | `go install github.com/opencode-ai/opencode@latest` |

Agents marked **MCP ✓** get live access to the project knowledge base (tasks, memory, rules, skills) during a run. Others receive the task prompt only.

## Prerequisites

- **Node.js >= 24** — check with `node --version`, install via [nvm](https://github.com/nvm-sh/nvm)
- **pnpm** — `npm install -g pnpm`
- At least one agent CLI installed and authenticated (Claude Code recommended)

## Quickstart

```bash
git clone https://github.com/AviranLevi/atlas.git
cd atlas
nvm use        # switches to Node 24 from .nvmrc
pnpm install
pnpm dev
```

Open **http://localhost:5173**.

The SQLite database is created automatically on first run — no setup required.

### 1. Add a provider

Go to **Agents → AI Providers → Add Provider** and enter your API key (Anthropic or OpenAI). This is what Atlas uses for its own features like chat, AI code review, and project briefs.

### 2. Create a project

Go to **Projects → New Project**. Set the **Local Path** to the absolute path of a git repository on your machine — this is where agent worktrees will be created.

### 3. Create an agent

Go to **Agents → New Agent**. Pick an executor (Claude Code is recommended), link it to your provider, and assign it to your project.

### 4. Add a task and run it

Open your project, create a task with a clear description and definition of done, then click **Start** to assign an agent to it. Atlas spawns the agent in a worktree and streams its output to the Workspace view. When the agent finishes, the task moves to **In Review** automatically.

## MCP Integration

Atlas exposes an MCP server so agents (and your IDE) can query project context directly.

### For Claude Code

Run `pnpm mcp` to start the stdio MCP server, then add it to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "atlas": {
      "command": "pnpm",
      "args": ["--filter", "@atlas/server", "mcp"],
      "cwd": "/path/to/atlas"
    }
  }
}
```

### For Cursor / other HTTP clients

The HTTP/SSE MCP server runs automatically on **http://localhost:3101** when Atlas is running. Go to **Settings** in the Atlas UI for the exact connection snippet to paste into Cursor or Claude Desktop.

### Available MCP tools

Agents with MCP access can use: `list_tasks`, `create_task`, `update_task`, `get_project_context`, `add_memory`, `list_memories`, `list_rules`, `list_skills`, `list_phases`, `get_review`, `submit_review`, `search`, `start_workspace`, and more.

## Architecture

Monorepo with three packages:

```
packages/
  shared/   # Zod schemas and TypeScript types
  server/   # Hono REST API + MCP server + Drizzle SQLite  (port 3100)
  client/   # React SPA (Vite + Tailwind + shadcn/ui)      (port 5173)
data/
  agents.db # SQLite database (gitignored, auto-created)
```

**Server layers:** Routes → Controllers → Services → Repositories → Drizzle/SQLite

See [MEMORIES.md](MEMORIES.md) for detailed architecture documentation.

## Environment Variables

All variables are optional — Atlas works out of the box without a `.env` file.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3100` | Server HTTP port |
| `MCP_PORT` | `3101` | MCP HTTP/SSE server port |

Copy `.env.example` to `.env` only if you need non-default ports.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all packages in dev mode |
| `pnpm dev:server` | Server only |
| `pnpm dev:client` | Client only |
| `pnpm build` | Build all packages |
| `pnpm lint` | Run Biome linter |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm format` | Format all files with Biome |
| `pnpm typecheck` | TypeScript type-checking across all packages |
| `pnpm test` | Run tests |
| `pnpm mcp` | Start the MCP server (stdio) for IDE integration |
| `pnpm db:generate` | Generate Drizzle migrations from schema changes |
| `pnpm db:migrate` | Run pending database migrations |

## Security Note

By default, the server allows CORS from all origins for local development. If you deploy Atlas on a shared network, configure CORS appropriately for your environment.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and PR workflow.

## License

[MIT](LICENSE)
