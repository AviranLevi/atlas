# Atlas

[![CI](https://github.com/AviranLevi/atlas/actions/workflows/ci.yml/badge.svg)](https://github.com/AviranLevi/atlas/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![status](https://img.shields.io/badge/status-alpha-orange)

> **Atlas is in alpha.** Expect breaking changes between minor versions until 1.0.

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
| [Ollama](https://ollama.ai) *(local, no API key)* | — | `ollama serve` + `pip install aider-chat` |

Agents marked **MCP ✓** get live access to the project knowledge base (tasks, memory, rules, skills) during a run. Others receive the task prompt only.

**Ollama (local AI):** Run open-source models like Qwen 2.5 Coder, DeepSeek R1, Gemma 3, Llama 3.2, and Phi-4 entirely offline — no API key needed. Install [Ollama](https://ollama.ai), pull a model (`ollama pull qwen2.5-coder`), and select **Ollama (Local AI)** as the executor.

---

## Installation

### Prerequisites

- **Node.js ≥ 24** — check with `node --version`, install via [nvm](https://github.com/nvm-sh/nvm)
- **pnpm** — `npm install -g pnpm`
- At least one agent CLI installed and authenticated (see table above)

### Install

```bash
git clone https://github.com/AviranLevi/atlas.git
cd atlas
nvm use          # switches to the required Node version from .nvmrc
pnpm install
pnpm dev
```

Open **http://localhost:5173**. The SQLite database is created automatically — no setup required.

---

## Updating

Pull the latest code and reinstall dependencies. The database migrates automatically when the server starts.

```bash
git pull
pnpm install
pnpm dev
```

That's it. No manual migration step needed.

> **If something breaks after an update:** the most common cause is a stale build artifact. Run `pnpm build` once, then `pnpm dev`.

---

## First-time setup

When you first open Atlas at **http://localhost:5173** with no API key or projects, you land in a guided 3-step onboarding flow at `/welcome`:

1. **API key** — generate a key (also accessible at `/setup` for legacy users)
2. **First project** — scaffold a fresh folder, pick an existing one, or (soon) clone from Git
3. **Done** — open the project workspace or add an agent

After at least one project exists you'll land on the **All Projects** dashboard whenever no project is active. The full project shell — Kanban, Workspaces, Chat, Memory, etc. — only renders once you select a project.

See [docs/onboarding.md](docs/onboarding.md) for the full state diagram, env vars, and security notes around the scaffold endpoint.

### 1. Add a provider

Go to **Agents → AI Providers → Add Provider** and enter your API key (Anthropic or OpenAI). This is what Atlas uses for its own AI features (chat, code review, project briefs).

> Skip this if you only plan to use Ollama — no key required.

### 2. Create a project

Go to **Projects → New Project**. Set the **Local Path** to the absolute path of a git repository on your machine — this is where agent worktrees will be created.

### 3. Create an agent

Go to **Agents → New Agent**. Pick an executor (Claude Code is recommended), link it to your provider, and assign it to your project.

### 4. Add a task and run it

Open your project, create a task with a clear description and definition of done, then click **Start**. Atlas spawns the agent in a worktree and streams its output to the Workspace view. When the agent finishes, the task moves to **In Review** automatically.

---

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

Agents with MCP access can use: `list_tasks`, `create_task`, `update_task`, `get_project_context`, `create_memory`, `update_memory`, `supersede_memory`, `list_memories`, `list_rules`, `list_skills`, `list_phases`, `get_review`, `submit_review`, `search`, `start_workspace`, and more.

---

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
| `ATLAS_ALLOWED_PARENT_ROOTS` | `~`, `~/Documents`, `~/code`, `~/dev`, `~/Projects`, `/tmp` | Colon-separated absolute paths the project scaffolder is allowed to create folders inside |
| `VITE_ATLAS_MARKETPLACE_ENABLED` | `false` | Surface the in-progress Marketplace nav entry |
| `ATLAS_AUTH_BYPASS` | `false` | Dev-only auth bypass — do not set in production |
| `VITE_ATLAS_NEW_SHELL` | `true` | Set to `false` to fall back to the legacy "always full shell" mode |
| `VITE_ATLAS_TOUR_DEBUG` | `false` | Surfaces tour telemetry table + `?tour-debug=1` page overlay |

Copy `.env.example` to `.env` to override any of the above defaults.

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

## Roadmap to 1.0

- **Commands & task templates** — quick parameterized invocations from Chat (`/refactor file.ts`) and Kanban ("New from template…"). See [docs/commands-plan.md](docs/commands-plan.md). Targets v0.2.0.
- **Remote access** — tunnel-based remote access to your local Atlas instance. See [docs/remote-access-plan.md](docs/remote-access-plan.md).
- **DB diagram viewer** — interactive, auto-laid-out schema diagram replacing the static Mermaid render. See [docs/db-diagram-plan.md](docs/db-diagram-plan.md).
- **End-to-end tests** — Playwright coverage for critical flows
- **Bundle perf trim** — code-split heavy deps (mermaid, cytoscape), target ≤ 500 KB gzip main chunk
- **Marketplace** — the route is reserved (`/marketplace`) but renders a "Coming soon" card. Set `VITE_ATLAS_MARKETPLACE_ENABLED=true` to surface the in-progress UI.

## Security Note

By default, the server allows CORS from all origins for local development. If you deploy Atlas on a shared network, configure CORS appropriately for your environment.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and PR workflow.

## License

[MIT](LICENSE)
