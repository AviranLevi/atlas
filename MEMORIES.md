# Atlas — Project Memory

## What This Is
A local-first AI agent orchestration hub. Single user now, architected for multi-user later.
- Control which AI agents run across multiple projects
- Agents connect via MCP (Model Context Protocol)
- Users create tasks, oversee phases, perform code reviews
- Agents can create tasks and update project memory via MCP

---

## Architecture

### Monorepo (pnpm workspaces)
- `packages/server` — Hono + Node.js + SQLite + Drizzle ORM, port 3100
- `packages/client` — React 19 + Vite + TailwindCSS 4, port 5173
- `packages/shared` — Zod schemas + TypeScript types shared between server and client

Package scope: `@atlas/shared`, `@atlas/server`, `@atlas/client`

### Key Tech Choices
- **Package manager**: pnpm (workspace protocol `workspace:*` for internal deps)
- **Node.js**: >= 24 (`.nvmrc` at root)
- **Runtime**: `tsx` for server dev, `vite` for client dev
- **ORM**: Drizzle ORM with SQLite (`better-sqlite3`), migrations via SQL files + runtime schema patches
- **State**: TanStack Query v5 for all client data fetching
- **MCP transport**: Two servers — stdio (original) + HTTP/SSE on port 3101
- **Linter/Formatter**: Biome (replaces ESLint + Prettier)
- **Test runner**: Vitest (package service tests written; expanding coverage)

### Server Layers
```
Routes (thin HTTP + zValidator) → Controllers (delegation) → Services (business logic) → Repositories (data access) → Drizzle/SQLite
MCP Tools (stdio/SSE) ────────────────────────────────────┘
```

- **Routes**: request validation + delegation only. No business logic.
- **Controllers**: extract validated params, call services, format HTTP responses.
- **Services**: all business logic. Each in its own subfolder with a `.types.ts` file. May call multiple repositories.
- **Repositories**: single-table data access. No cross-entity logic.
- **MCP Tools**: Zod-validated input using shared Zod enums (`TaskStatusEnum`, `SkillTypeEnum`, etc.), delegates to services. No business logic.

---

## Database

### Tables
| Table | Description |
|---|---|
| `agents` | AI agent profiles (name, description, personality, provider_id) |
| `agent_skills` | Junction: agent ↔ skill |
| `agent_rules` | Junction: agent ↔ rule (was `dispatch_rules`) |
| `agent_projects` | Junction: agent ↔ project |
| `agent_providers` | API keys + model configs (anthropic, openai, openai-compatible, ollama) |
| `tasks` | Kanban tasks with status, priority, estimate, DoD, phase_id |
| `projects` | Projects with localPath for worktree creation |
| `skills` | Reusable agent skills |
| `skill_resources` | Junction: skill ↔ resource |
| `rules` | Rules (global and project-scoped) |
| `memory` | Project/global memory entries |
| `quick_actions` | Reusable one-click workflows (agent + prompt template, project-scoped or global) |
| `workspaces` | Agent execution environments (process tracking) |
| `settings` | Key-value global settings |
| `global_instructions` | Global instruction entries |
| `phases` | Project milestones with order_index, status, progress tracking |
| `reviews` | Task review system with JSON checklist, reviewer type, decision |
| `activity_log` | Write-only audit trail (no FK references, best-effort) |
| `chat_conversations` | Chat conversation metadata |
| `chat_messages` | Chat messages with role, content, tool calls, and file attachments (base64 JSON) |
| `preferences` | User preferences (key-value) |

### Migrations (SQL files in `db/migrations/`)
- `0000` — Initial schema (agents, tasks, projects, skills, memory, settings, etc.)
- `0001` — Add project status, color, tags
- `0002` — Add localPath to projects, workspaces table
- `0003` — Add agent_providers, phases, reviews, activity_log
- `0004` — Chat conversations + messages tables
- `0005` — Chat and preferences table recreation (idempotent)
- `0006` — Secondary indexes on FK/filter columns, unique constraints on junction tables
- `0007` — Dispatch rule auto-start column
- `0008` — Task source field
- `0014` — Add `attachments` column to `chat_messages`

### Schema Patches (`db/schema-patches.ts`)
Runtime `ALTER TABLE ADD COLUMN` statements wrapped in try/catch for columns that may already exist. Applied after migrations on startup. Used for incremental schema changes that can't be cleanly expressed as Drizzle migrations (e.g., columns added via manual hacks before migrations existed).

### DB Initialization (`db/index.ts`)
1. Opens SQLite with WAL mode + foreign keys
2. Runs Drizzle migrations
3. Applies schema patches
4. Exports `db` instance and `schema`

---

## MCP Integration

### Stdio MCP (`mcp.ts`)
Standalone stdio server for IDE integration (Cursor, Claude Code).

### HTTP/SSE MCP (`mcp-http.ts`)
Standalone Node.js `http.createServer` (NOT Hono — `SSEServerTransport` requires raw `IncomingMessage`/`ServerResponse`). Session registry with `Map<sessionId, SSEServerTransport>`.

### Registered MCP Tools
| File | Tools |
|---|---|
| `agents.tools.ts` | list_agents, get_agent |
| `agent-providers.tools.ts` | list_providers, get_provider, list_provider_models |
| `tasks.tools.ts` | create_task, update_task, list_tasks |
| `memory.tools.ts` | add_memory, list_memories |
| `projects.tools.ts` | get_project_context |
| `skills.tools.ts` | list_skills, get_skill |
| `rules.tools.ts` | list_rules, get_rule |
| `phases.tools.ts` | list_phases, get_phase |
| `reviews.tools.ts` | get_review, submit_review |
| `search.tools.ts` | search |
| `settings.tools.ts` | get_settings |
| `quick-actions.tools.ts` | list_quick_actions, get_quick_action, run_quick_action |
| `workspaces.tools.ts` | start_workspace (with baseBranch, model, providerId) |

### MCP Config Endpoint
`GET /api/v1/mcp/connection-info` — returns SSE URL, Cursor config, Claude Desktop config, stdio config for Settings UI.

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
- `POST /api/v1/workspaces/:id/start-ai-review` → spawns a reviewer agent via `orchestratorService.startAiReview(workspaceId, ...)`
- `POST /api/v1/reviews/:id/ai-review` → the reviewer agent itself submits its decision through this endpoint (`submitAiReview`)
- Reviewer receives diff + task context + DoD checklist, calls `submit_review` MCP tool
- Optional `autoFix` flag lets the reviewer fix issues directly before submitting
- The route is workspace-scoped (not task-scoped) because a workflow task has multiple workspaces in its brainstorm→plan→execute lineage and only the caller (the client) knows which one the user is viewing. Resolving from task ID picks an arbitrary workspace and trips the "only on completed workspaces" gate.

### Circular dependency fix
- `reviews.service.ts` needs `tasksRepository`
- `tasks.service.ts` needs `ReviewsService`
- **Fix**: `tasks.service.ts` uses `await import(...)` (lazy dynamic import) so circular ref only exists at call-time

---

## Chat System

- `/chat` page with conversation sidebar, message list, tool call rendering
- Server: `chat.service.ts` handles streaming via providers (Anthropic/OpenAI/Google/Ollama)
- Client: `use-chat.hook.ts` uses `api.stream()` for SSE-style streaming
- Tools available in chat: project context, task management, memory, file browsing
- Chat conversations and messages persisted to SQLite

### File Attachments

Users can attach files to any chat message (max 5 files, max 10 MB each):

| File type | Anthropic | OpenAI | Google | Ollama |
|-----------|-----------|--------|--------|--------|
| Images (PNG, JPEG, WebP, GIF) | vision block | `image_url` | `inline_data` | model-dependent |
| PDF | native `document` block | text extraction (pdf-parse) | `inline_data` | — |
| Text / code / CSV / JSON | `<file>` text block | `<file>` text block | text part | text part |

**Data flow:**
- Client encodes files to base64 via `FileReader` (`lib/file-utils.ts`) and sends in the POST body
- Server stores base64 in `chat_messages.attachments` (JSON column, migration `0014`)
- On conversation replay, attachments are re-sent to the AI with every follow-up turn
- `lib/chat/attachment-utils.ts` — shared helpers: `isImage`, `isPdf`, `isTextFile`, `extractPdfText` (pdf-parse), `decodeText`, `wrapFileContent`

**CLI backend**: attachments are not forwarded to CLI agents (Claude Code, Aider, etc.) — text prompt only.

**UI components:**
- `ChatInput` — paperclip button, staged file chip strip (`FileChip`), async send
- `AttachmentPreview` — renders sent attachments in user message bubbles (image thumbnails, file icons)

---

## Package Import / Export

### Format
Portable JSON packages (`.atlas.json` convention, any `.json` accepted on import). Validated by `AtlasPackageSchema` in `@atlas/shared`.

```json
{
  "atlas": "1.0",
  "type": "agent" | "skill" | "rule",
  "name": "...",
  "version": "1.0.0",
  "agent": { ... },      // optional — derived from CreateAgentSchema minus providerId/defaultModel
  "skills": [ ... ],     // optional — derived from CreateSkillSchema minus projectId
  "rules": [ ... ]       // optional — derived from CreateRuleSchema minus projectId
}
```

A single package can bundle an agent with its skills and rules. No IDs, timestamps, project scoping, or API keys are included.

### Export
- Export buttons on agent, skill, and rule detail pages → `GET /api/v1/packages/export/{agent|skill|rule}/:id`
- Returns a downloadable `.atlas.json` file with Content-Disposition header
- Agent export includes associated skills, rules, and a provider hint (type + model, no API key)

### Import
- Import buttons on Agents, Skills, and Rules list pages (not in Settings)
- Two-step dialog: upload → review/resolve conflicts
- `POST /api/v1/packages/import/preview` — validates package, detects name conflicts, matches provider hints
- `POST /api/v1/packages/import` — executes import with user-chosen resolutions (create/overwrite/rename)
- Upload step includes type badges, bundle explanation, and syntax-highlighted JSON format example

### Server
- `PackageService` in `services/package/` handles export stripping and import logic
- `package.controller.ts` + `package.route.ts` for HTTP layer
- Tests: `package.service.test.ts` covers export, import, conflicts, validation

---

## Client UI

### Pages
| Route | Page | Description |
|---|---|---|
| `/agents` | AgentsPage | Agent cards + AI Providers section |
| `/agents/:id` | AgentDetailPage | Agent detail with skills, rules, projects, model selector |
| `/kanban` | KanbanPage | Drag-and-drop board with active workspace indicators |
| `/workspaces` | WorkspacesPage | Full workspace management with status tabs |
| `/workspaces/:id` | WorkspaceDetailPage | Individual workspace detail and logs |
| `/projects` | ProjectsPage | Project cards |
| `/projects/:id` | ProjectDetailPage | Project detail with phases, tasks, knowledge graph |
| `/skills` | SkillsPage | Skills list |
| `/skills/:id` | SkillDetailPage | Skill detail |
| `/rules` | RulesPage | Rules list |
| `/rules/:id` | RuleDetailPage | Rule detail |
| `/memory` | MemoryPage | Memory entries with expandable rows |
| `/chat` | ChatPage | Chat interface with conversation history |
| `/global` | GlobalPage | Global instructions |
| `/usage` | UsagePage | Token usage and cost tracking |
| `/quick-actions` | QuickActionsPage | Quick actions list with run/edit/delete |
| `/quick-actions/new` | QuickActionNewPage | Full-page create form with template picker |
| `/quick-actions/:id` | QuickActionDetailPage | Quick action detail with inline editing |
| `/settings` | SettingsPage | MCP connection panel + settings |

### Page File Convention
Each page directory follows the kebab-case naming convention:
- `page-name.page.tsx` — the page component
- `page-name.types.ts` — types local to that page
- `page-name.constants.ts` — constants and config objects
- `components/` — sub-components used only by that page

Some older pages (e.g. `agent-detail/`, `chat/`, `project-detail/`) still use PascalCase files directly in the folder; these are being migrated incrementally.

### Key Components
- `KanbanCard` — shows `ReviewBadge` for "In Review" tasks, pulsing terminal icon for active agents
- `StartWorkDialog` — agent selection, branch, model, provider for launching workspaces. Uses extracted `ModelSection`, `TaskSummary`, `RuntimeSelect`, `BranchSelect` sub-components with types in `workspaces.types.ts`
- `McpConnectionPanel` — SSE URL, Cursor config, Claude Desktop config with copy buttons
- `AgentProviderDialog` — dynamic fields (baseUrl for openai-compatible/ollama, apiKey hidden for ollama)
- `PhaseCard` — progress bar, status badge, hover edit/delete
- `ReviewPanel` — checklist toggle, notes, Approve/Request Changes buttons
- All mutation dialogs display error feedback on failure

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

## Known Issues / Workarounds

### drizzle-kit in git worktrees
- `drizzle-kit generate` can fail with path resolution bugs in worktree paths
- **Fix**: Write migration SQL manually + update `meta/_journal.json`

### MCP SSE + Hono incompatibility
- `SSEServerTransport` requires raw Node.js `IncomingMessage`/`ServerResponse`
- Hono abstracts these, so SSE server runs as separate `http.createServer` on port 3101

### Shared constants
- `TASK_STATUS` constant object (`BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, `BLOCKED`) defined in `@atlas/shared` with `as const satisfies`
- Used across both client (kanban, task dialogs) and server (orchestrator, tasks, reviews, projects services)
- MCP tools import shared Zod enums directly (`TaskStatusEnum`, `SkillTypeEnum`, `MemoryScopeEnum`, etc.) — zero inline `z.enum` duplication

### `as any` casts remaining
- `orchestrator.service.ts` — 5 casts (Drizzle insert type mismatches)
- `workspaces.repository.ts` — 3 casts (JOIN row enrichment typing)
- `projects.repository.ts` — 1 cast (serialized insert)
- `hono-helpers.ts` — 2 casts (intentional, zValidator runtime augmentation)
- Client: zero `as any` casts

---

## File Structure
```
packages/
  server/src/
    controllers/        ← HTTP request handling, delegates to services
    db/
      schema/           ← Drizzle table definitions (16 tables)
      repositories/     ← DB access layer (16 repositories)
      migrations/       ← SQL migration files (0000–0008)
      schema-patches.ts ← Runtime ALTER TABLE patches
      index.ts          ← DB initialization
    services/           ← Business logic (21 services, each in own subfolder; 7 have dedicated .types.ts files)
    routes/             ← Hono route definitions + zValidator middleware
    mcp/                ← MCP tool registrations (13 tool files + register-all.ts)
    executors/          ← Agent process spawning + detection
    lib/
      chat/             ← Chat streaming, tools
      providers/        ← Provider clients + adapters
      filesystem-scanner/ ← Project scanning
      utils/            ← Shared utilities (withTimeout, parseTags, etc.)
      errors.ts         ← AppError class
      logger.ts         ← Structured logger
      hono-helpers.ts   ← Type-safe zValidator wrappers
    mcp.ts              ← Stdio MCP server entry
    mcp-http.ts         ← HTTP/SSE MCP server entry
    index.ts            ← Hono app + HTTP server entry
  client/src/
    pages/              ← 15 page directories (kebab-case .page.tsx convention; some older pages still PascalCase, migrating)
    components/
      agents/           ← AgentDialog, AgentProviderDialog, ProviderTypeBadge
      kanban/           ← KanbanCard, KanbanColumn, TaskDialog
      phases/           ← PhaseCard, PhaseDialog
      reviews/          ← ReviewBadge, ReviewPanel
      settings/         ← McpConnectionPanel
      workspaces/       ← StartWorkDialog
      memory/           ← MemoryDialog
      projects/         ← ProjectDialog
      skills/           ← SkillDialog
      rules/            ← RuleDialog
      packages/         ← ImportPackageDialog, UploadStep, ReviewStep, ConflictItem
      layout/           ← Layout, nav, sidebar
      ui/               ← shadcn/ui primitives
    hooks/              ← 18 TanStack Query hook files
    contexts/           ← ProjectContext (active project state)
    lib/
      api.ts            ← Centralized API client (get, post, put, delete, stream, fireAndForget)
      utils.ts          ← cn() utility
      format.ts         ← timeAgo, calcDuration formatters
  shared/src/
    schemas/            ← 15 Zod schema files (agents, tasks, projects, skills, rules, memory, package, etc.)
    index.ts            ← Barrel re-export
data/
  agents.db             ← SQLite database (gitignored)
```
