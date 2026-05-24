# Changelog

All notable changes to Atlas will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **Quick Actions** — reusable one-click workflows that pair an agent with a prompt template. Full-stack CRUD (shared schemas, DB, API, MCP tools, UI). Nine starter templates (Commit & Push, Code Review, Create PR, etc.). Scoped per-project or globally. Visual icon picker with 28 Lucide icons. Accessible from sidebar, project detail, and Settings. API route: `/api/v1/quick-actions`. MCP tools: `list_quick_actions`, `get_quick_action`, `run_quick_action`.
- **Dev setup script** — `pnpm setup` one-command script installs Node 24 via fnm, pnpm, dependencies, rebuilds native modules, and builds all packages.
- **Gemini CLI auth detection** — Gemini CLI now has proper authentication checking via `authCheck` config, preventing false "ready" status when unauthenticated.
- **Schema-enforced delete cascades** — every foreign key now has an explicit `ON DELETE` policy (CASCADE / SET NULL / RESTRICT) applied at the SQLite layer via a one-time table rebuild (`apply-fk-cascade-policy.ts`). Replaces ~70 lines of imperative cascade code in `projects.removeWithRelations`.
- **Agent-delete RESTRICT pre-check** — deleting an agent with active task assignments returns HTTP 409 with `{ agentId, agentName, taskCount }` so the UI can render a precise "reassign first" toast instead of a raw FK error.
- **Provider-disconnected UI** — when a chat conversation's or agent's `provider_id` is nulled out by a provider deletion, an `Unplug` indicator surfaces in the chat sidebar / agents grid and the chat input is disabled with a banner explaining the state. Conversation history is preserved instead of being deleted alongside the provider.

### Changed
- `ApiError` now carries an optional `details` payload from the server's error body so callers can render structured UI without parsing message strings.
- **Auto-bootstrap API key** — first-time browser load now silently calls `POST /api/v1/auth/bootstrap` and stores the returned key in `localStorage`. The welcome flow no longer asks the user to name and copy a key. Keys are still managed (rotated, revoked) from Settings → API Keys. Existing browsers with a stored key are unaffected.

### Removed
- `ApiKeyStep` onboarding component and the `/setup` page that used it. The page now redirects to `/welcome`. `useSetupApiKey` hook is removed (the underlying `POST /auth/setup` endpoint remains available behind the new localhost-only middleware for power users).

### Security
- **`/api/v1/auth/*` is now localhost-only.** Previously these endpoints were exempt from `authMiddleware` and reachable from any host on the LAN, meaning anyone on the same network could mint, list, or revoke API keys against a default-bound dev server. A new `localOnly` middleware enforces an `Origin` allowlist (primary, defends against DNS rebinding) plus a `Host` allowlist (backup, catches dual-spoofed Origin). IPv6 (`[::1]`) is included in both.
- **Lockout escape hatch** — `pnpm atlas:reset-auth` (with interactive `[y/N]` confirmation, `--force` for scripted use) clears `api_keys` so a fresh bootstrap can run. Documented in README troubleshooting.

## [0.1.0] — 2026-04-26 (Alpha)

### Added
- **First-run UX** — welcome stepper with API-key generation, project creation (scaffold / pick-existing / clone stub), and reusable `ApiKeyStep` component
- **Three-state shell** — `firstRun` / `noActiveProject` / `activeProject` modes with `useShellMode` hook and `RouteGuard` redirects
- **Project scaffold endpoint** — `POST /projects/scaffold` with `mkdirSafe`, `git init`, allowed-roots enforcement, and adversarial-input validation
- **Marketplace placeholder** — nav entry behind `VITE_ATLAS_MARKETPLACE_ENABLED` feature flag
- **Empty-state library** — contextual empty states across 9 pages
- **Onboarding tour engine** — Driver.js wrapper, 11 guided tours (projects-dashboard, kanban, agents, workspaces, workspace-detail, chat, memory, documents, skills, rules, global), fatigue-based auto-pause
- **HintDots** — 5 discoverable hint dots across key UI surfaces
- **Tour telemetry** — Settings → Onboarding tab, telemetry table, `?tour-debug=1` overlay
- **Reduced-motion path** — respects `prefers-reduced-motion` for all tour animations
- **Per-step commits** — structured `step N/M` commit protocol with revert support
- **AI code review** — auto-triggered re-review on implementer completion, verdict panel, `aiReviewing` workspace state
- **Workflow approval panel** — rejection functionality for workspace workflows
- **Structured output views** — brainstorm and plan stage views in workspace detail
- **Workspace diff viewer** — diff handling with file size limits and error management
- **Inline model fetching** — dynamic model selection in agent provider dialog and `StartWorkDialog`
- **Runtime limits & cleanup** — server-side resource limits and cleanup services
- **@agent mention** — mention agents in chat with `@agent` syntax
- **Node.js version check** — pre-dev script validates Node ≥ 24
- **Gemini 3.1 Pro** — added model support
- **Commit plan feature** — plan commits in workspace management
- **Background execution** — structured brainstorming and planning stages run in background
- **Safety net** — catches uncommitted changes in workspace management
- **404 handling** — `NotFoundPage` + catch-all route
- **Funding & security workflows** — GitHub community files

### Changed
- Workspace detail refactored from boolean tangle to view state machine
- Code review services refactored with new diff handling architecture
- Agent provider removal nullifies foreign keys instead of cascading
- Test infrastructure extracted into dedicated mock and type directories

### Fixed
- Responsive Kanban columns at narrow viewport
- Kanban card click opens edit dialog
- ModelSection "Agent default" gated on provider match
- Obsidian "Sync now" gated on saved enabled state
- MCP tab header layout at narrow viewport
- Agent detail shows "not found" immediately on error
- Disabled retry on 404 responses
- Review watchdog + rollback attached to `applyReviewFix`

## [0.0.1] — 2026-04-07

### Added
- **Agent orchestration** — create and manage AI coding agents (Claude Code, Aider, Codex CLI, Gemini CLI, Goose, OpenCode, Amp)
- **Task management** — Kanban board with Backlog, To Do, In Progress, In Review, Done, and Blocked columns
- **Workspaces** — isolated git worktrees per agent run with stdout/stderr log streaming
- **Code review workflow** — auto-generated checklists from task definition of done; human and AI reviewer options
- **Project knowledge base** — rules, skills, memory entries, and phase tracking per project
- **MCP integration** — stdio and HTTP/SSE MCP servers; Claude Code and Gemini CLI get live project context during agent runs
- **Chat interface** — conversational AI with SSE streaming and tool access to project data
- **Package system** — export and import agents, skills, and rules as portable `.atlas.json` files
- **Agent providers** — Anthropic, OpenAI, OpenAI-compatible, and Ollama support with connection testing
- **Activity log** — write-only audit trail of agent starts, completions, failures, and task transitions
- **Usage tracking** — token usage and cost visibility
- **Knowledge graph** — force-directed graph view of project relationships (agents, tasks, memory, rules)
- **Heartbeat scheduling** — cron-based agent health checks
