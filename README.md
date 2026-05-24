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

### Quick Actions

**Quick Actions** are reusable one-click workflows — named presets that pair an agent with a prompt template. Examples: "Commit & Push", "Code Review", "Create PR", "Write Tests". They can be scoped globally (available to all projects) or per-project. Nine starter templates are included to get you going. Quick Actions are accessible from the sidebar, the project detail page, and Settings.

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

### Quick install (recommended)

One command installs Node.js 24, pnpm, Atlas itself, and optionally registers it as a background service that starts automatically on login:

```bash
curl -fsSL https://raw.githubusercontent.com/AviranLevi/atlas/main/install.sh | bash
```

The installer:
1. Installs **Node.js 24** via [fnm](https://github.com/Schniz/fnm) (no sudo, no system pollution)
2. Installs **pnpm** via corepack
3. Clones Atlas to `~/.atlas/`
4. Builds all packages
5. Installs the `atlas` CLI to `~/.local/bin/atlas`
6. Asks whether to register a startup service (LaunchAgent on macOS, systemd user unit on Linux)
7. Opens **http://localhost:3100** in your browser

Re-running the script on an existing install performs an in-place update instead of a fresh clone.

**Custom install location:**
```bash
ATLAS_HOME=/opt/atlas curl -fsSL https://raw.githubusercontent.com/AviranLevi/atlas/main/install.sh | bash
```

### Running as a background service

The installer prompts you to set this up. You can also manage it manually at any time:

```bash
atlas service install    # register as LaunchAgent (macOS) or systemd unit (Linux)
atlas service uninstall  # remove the service
atlas start              # start manually without a service
atlas stop               # stop the server
atlas status             # show PID, port, health
```

The service restarts automatically on crash and starts again on every login/boot.

### The `atlas` CLI

After install, `atlas` is available on your PATH:

| Command | Description |
|---------|-------------|
| `atlas start` | Start Atlas in the background |
| `atlas stop` | Stop the server |
| `atlas restart` | Stop then start |
| `atlas status` | PID, port, HTTP health |
| `atlas logs` | Tail stdout + stderr logs |
| `atlas open` | Open http://localhost:3100 |
| `atlas update` | Pull latest, rebuild, restart |
| `atlas service install` | Register as login/boot service |
| `atlas service uninstall` | Remove service |
| `atlas uninstall` | Remove Atlas completely |

---

### Manual install (for contributors / development)

Use this path if you want to run from source with hot-reload.

**One-command setup:**

```bash
git clone https://github.com/AviranLevi/atlas.git
cd atlas
pnpm setup       # installs Node 24 via fnm, pnpm, dependencies, and builds
pnpm dev
```

**Or manually:**

**Prerequisites:**
- **Node.js 24** — check with `node --version`, install via [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm)
- **pnpm** — `npm install -g pnpm`
- At least one agent CLI installed and authenticated (see table above)

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

**With the `atlas` CLI** (quick install):
```bash
atlas update
```
Pulls latest changes, reinstalls dependencies, rebuilds, and restarts the server automatically.

**Manual (dev install):**
```bash
git pull
pnpm install
pnpm dev
```

The database migrates automatically when the server starts — no manual migration step needed.

> **If something breaks after an update:** the most common cause is a stale build artifact. Run `pnpm build` once, then restart.

---

## First-time setup

When you first open Atlas at **http://localhost:5173** with no projects, you land in a guided 2-step onboarding flow at `/welcome`:

1. **First project** — scaffold a fresh folder, pick an existing one, or (soon) clone from Git
2. **Done** — open the project workspace or add an agent

> The browser silently bootstraps an API key on first load. You can rotate or revoke it at any time from **Settings → API Keys**.

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

Agents with MCP access can use: `list_tasks`, `create_task`, `update_task`, `get_project_context`, `create_memory`, `update_memory`, `supersede_memory`, `list_memories`, `list_rules`, `list_skills`, `list_phases`, `get_review`, `submit_review`, `search`, `start_workspace`, `list_quick_actions`, `get_quick_action`, `run_quick_action`, and more.

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
| `pnpm setup` | One-command dev setup (installs Node 24, pnpm, dependencies, builds) |
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
| `pnpm atlas:reset-auth` | Delete all stored API keys (lockout escape hatch) |

## Troubleshooting

**Locked out of the UI after clearing browser data?** Atlas only stores SHA-256 hashes of API keys, so a cleared `localStorage` plus an existing keys table means the app can't auto-bootstrap a new key. Run:

```bash
pnpm atlas:reset-auth
```

Confirm the prompt, then reload the page — the browser will mint a fresh key. Pass `--force` (or set `ATLAS_RESET_AUTH_FORCE=1`) to skip the prompt in scripted setups.

**`/api/v1/auth/*` returning 403?** All auth endpoints require a localhost origin. If you're hitting them from a different machine, route via SSH tunnel or wait for the Tailscale-based remote-access feature.

## Roadmap to 1.0

See [docs/roadmap.md](docs/roadmap.md) for full detail on each item.

- **Agent Flows** *(v0.2)* — chain agents into reusable multi-step pipelines (plan → review → execute → critique). Visual editor built on React Flow, shareable bundle export/import, per-step model selection, checkpoint approvals between steps.
- **Commands & task templates** *(v0.2)* — quick parameterized invocations from Chat (`/refactor file.ts`) and Kanban ("New from template…"). See [docs/commands-plan.md](docs/commands-plan.md).
- **Semantic memory** *(v0.3)* — replace keyword-based memory retrieval with vector similarity search. Pluggable embedding providers (Google Gemini Embedding 2, OpenAI, local). Enables cross-modal search over attached PDFs and images.
- **DB diagram viewer** *(v0.3)* — interactive, auto-laid-out schema diagram replacing the static Mermaid render. See [docs/db-diagram-plan.md](docs/db-diagram-plan.md).
- **Event-driven triggers** *(v0.3)* — automatic trigger/action rules: `onFlowComplete → save memory`, `onTaskComplete → notify`. No-code builder UI. See [docs/rules-skills-hooks-plan.md](docs/rules-skills-hooks-plan.md).
- **Authored diagrams** *(v0.4)* — draw flow/architecture diagrams using React Flow, save as project documents, `@`-mention from tasks/chat, expose via MCP for 3rd-party agents (Cursor, etc.). See [docs/authored-diagrams-plan.md](docs/authored-diagrams-plan.md).
- **Remote access** — tunnel-based remote access to your local Atlas instance. See [docs/remote-access-plan.md](docs/remote-access-plan.md).
- **End-to-end tests** — Playwright coverage for critical flows.
- **Bundle perf trim** — code-split heavy deps (mermaid, cytoscape), target ≤ 500 KB gzip main chunk.
- **Marketplace** — the route is reserved (`/marketplace`) but renders a "Coming soon" card. Set `VITE_ATLAS_MARKETPLACE_ENABLED=true` to surface the in-progress UI.

## Security Note

By default, the server allows CORS from all origins for local development. If you deploy Atlas on a shared network, configure CORS appropriately for your environment.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and PR workflow.

## License

[MIT](LICENSE)
