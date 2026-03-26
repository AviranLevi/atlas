# Atlas — Project Memory

## What This Is
A local-first AI agent orchestration hub. Single user now, architected for multi-user later.
- Control which AI agents run across multiple projects
- Agents connect via MCP (Model Context Protocol)
- Users create tasks, oversee phases, perform code reviews
- Agents can create tasks and update project memory via MCP

---

## Architecture

### Monorepo (npm workspaces)
- `packages/server` — Hono + Node.js + SQLite + Drizzle ORM, port 3100
- `packages/client` — React 19 + Vite + TailwindCSS, port 5173
- `packages/shared` — Zod schemas + TypeScript types shared between server and client

### Key Tech Choices
- **Runtime**: `tsx` for server (not compiled), `vite` for client dev
- **ORM**: Drizzle ORM with SQLite (`better-sqlite3`), migrations via SQL files (NOT drizzle-kit — it has path resolution bugs in git worktrees)
- **State**: TanStack Query v5 for all client data fetching
- **MCP transport**: Two servers — stdio (original) + HTTP/SSE on port 3101

---

## Database Schema

### Original tables
- `agents` — AI agent profiles (name, description, personality, rules)
- `tasks` — Kanban tasks with status, priority, estimate, DoD
- `projects` — Projects with localPath for worktree creation
- `skills` — Reusable agent skills
- `dispatch_rules` — Pattern-based agent routing rules
- `memory` — Project/global memory entries
- `workspaces` — Agent execution environments (process tracking)
- `settings` — Key-value global settings

### New tables (migration 0003)
- `agent_providers` — API keys and model configs (anthropic, openai, openai-compatible, ollama)
- `phases` — Project milestones with order_index, status, progress tracking
- `reviews` — Task review system with JSON checklist, reviewer type, decision
- `activity_log` — Write-only audit trail (no FK references, best-effort)

### Schema modifications
- `agents.provider_id` → FK to `agent_providers.id`
- `tasks.phase_id` → FK to `phases.id`
- `workspaces` now returns `taskName` + `projectName` via LEFT JOIN (enriched at query time)

---

## MCP Integration

### Stdio MCP (original)
- `packages/server/src/mcp.ts` — standalone stdio server
- Tools: create_task, update_task, list_tasks, add_memory, list_memories, get_project_context

### HTTP/SSE MCP (new, port 3101)
- `packages/server/src/mcp-http.ts` — standalone Node.js http.createServer (NOT Hono — SSEServerTransport requires raw IncomingMessage/ServerResponse)
- Session registry: `Map<sessionId, SSEServerTransport>`
- GET /sse → creates transport, POST /messages → routes to session

### New MCP tools added
- `list_phases`, `get_phase` — phase browsing for agents
- `get_review`, `submit_review` — review workflow for agents

### MCP Config endpoint
- `GET /api/v1/mcp/connection-info` — returns SSE URL, Cursor config, Claude Desktop config, stdio config for Settings UI

---

## Agent Lifecycle

### Starting an agent
1. `POST /api/v1/workspaces` → `orchestratorService.startWork(taskId, agentRuntimeId)`
2. Creates git worktree in `{project.localPath}/.agent-workspaces/`
3. Spawns agent process, captures stdout/stderr to log file
4. Task status → "In Progress"
5. Activity log: `agent_started`

### Agent completes (exit code 0)
- Workspace status → "completed"
- **Task status → "In Review"** (auto-creates review checklist from DoD)
- Activity log: `agent_completed`

### Agent fails (non-zero exit or spawn error)
- Workspace status → "failed"
- **Task status → "To Do"** (reset for retry)
- Activity log: `agent_failed`

### Stopping manually
- `POST /api/v1/workspaces/:id/stop` → SIGTERM → SIGKILL after 5s
- Task status → "To Do"
- Activity log: `agent_stopped`

### Server restart reconciliation
- `reconcileOnStartup()` runs on boot
- Finds all running/pending workspaces, kills live PIDs, marks as "failed"
- **Resets associated tasks to "To Do"**

---

## Review System

### Auto-creation
- When task status changes to "In Review", `tasks.service.ts` lazily imports `reviews.service.ts` and calls `createForTask()`
- Checklist is parsed from `task.definitionOfDone` (line-split)
- Only creates if no review exists yet

### Review decision
- `POST /api/v1/reviews/:id/decide` → `{ decision: 'approved' | 'changes_requested', notes? }`
- Approved → task status → "Done"
- Changes requested → task status → "In Progress"

### AI reviews
- `POST /api/v1/reviews/:id/ai-review` — placeholder for AI-driven review flow

### Circular dependency fix
- `reviews.service.ts` needs `tasksRepository`
- `tasks.service.ts` needs `ReviewsService`
- **Fix**: `tasks.service.ts` uses `await import('./reviews.service.js')` (lazy dynamic import) so circular ref only exists at call-time

---

## Development Phases

- Phases are project milestones with `name`, `description`, `status`, `order_index`
- `phases.repository.ts` uses LEFT JOIN to count tasks per phase (`taskCount`, `doneCount`)
- Deleting a phase NULLifies `tasks.phase_id` (no cascade delete)
- Progress = doneCount / taskCount shown as progress bar in `PhaseCard`

---

## Agent Providers

- Supports: `anthropic`, `openai`, `openai-compatible`, `ollama`
- `POST /api/v1/agent-providers/:id/test` → tests connection with 10s timeout
- Anthropic: uses `@anthropic-ai/sdk`
- OpenAI/compatible: uses `openai` npm package
- Ollama: fetch to `{baseUrl}/api/generate`
- Agents can be linked to a provider via `agent.provider_id`

---

## Activity Log

- Write-only audit trail in `activity_log` table
- No FK references (intentional — best-effort, never blocks)
- Event types: `task_created`, `task_status_changed`, `agent_started`, `agent_completed`, `agent_failed`, `agent_stopped`
- `activityLogService.log()` never throws
- Instrumented in: tasks.service, orchestrator.service

---

## Client UI

### Pages
| Route | Page | Description |
|---|---|---|
| `/agents` | AgentsPage | Agent cards + AI Providers section at top |
| `/kanban` | KanbanPage | Drag-and-drop board with active workspace indicators |
| `/workspaces` | WorkspacesPage | Full workspace management page with status tabs |
| `/projects/:id` | ProjectDetailPage | Project detail with Phases section |
| `/settings` | SettingsPage | MCP connection panel + global instructions + dispatch rules |

### Key components
- `KanbanCard` — shows `ReviewBadge` for "In Review" tasks, pulsing terminal icon for tasks with active agent
- `WorkspacesPage` — replaces the old sidebar panel; shows task name (from JOIN), filter tabs, collapsible output
- `McpConnectionPanel` — SSE URL, Cursor config, Claude Desktop config with copy buttons
- `AgentProviderDialog` — dynamic fields (baseUrl shown for openai-compatible/ollama, apiKey hidden for ollama)
- `PhaseCard` — progress bar, status badge, hover edit/delete
- `ReviewPanel` — checklist toggle, notes, Approve/Request Changes buttons

### WorkspaceStatusPanel → WorkspacesPage migration
- `WorkspaceStatusPanel` removed from KanbanPage bottom
- Replaced by `/workspaces` page with full feature set
- Nav badge shows active agent count with live blue dot

---

## Known Issues / Workarounds

### drizzle-kit OOM in git worktrees
- `npm run db:generate` fails with "Cannot find module '../helpers/index.js'" in worktree paths
- **Fix**: Write migration SQL manually + update `meta/_journal.json`

### tsc --noEmit heap OOM
- Large AI SDK types (@anthropic-ai/sdk, openai) cause OOM during full type check
- **Fix**: Use `npx tsx packages/server/src/index.ts` directly; type errors in these packages are pre-existing and not runtime issues

### MCP SSE + Hono incompatibility
- `SSEServerTransport` requires raw Node.js `IncomingMessage`/`ServerResponse`
- Hono abstracts these, so SSE server runs as separate `http.createServer` on port 3101

---

## File Structure (key paths)
```
packages/
  server/src/
    db/
      schema/           ← Drizzle schemas (all tables)
      repositories/     ← DB access layer
      migrations/       ← SQL migration files (manual)
    services/           ← Business logic
    routes/             ← Hono route handlers
    mcp/                ← MCP tool registrations
    mcp-http.ts         ← HTTP/SSE MCP server
    mcp.ts              ← stdio MCP server
  client/src/
    pages/              ← Page components
    components/
      agents/           ← AgentDialog, AgentProviderDialog
      kanban/           ← KanbanCard, KanbanColumn, TaskDialog
      phases/           ← PhaseCard, PhaseDialog
      reviews/          ← ReviewBadge, ReviewPanel
      settings/         ← McpConnectionPanel
      workspaces/       ← StartWorkDialog, WorkspaceStatusPanel (legacy)
    hooks/              ← TanStack Query hooks for every entity
  shared/src/schemas/   ← Zod schemas + TypeScript types
```
