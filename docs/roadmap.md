# Atlas Roadmap

> Atlas is in **alpha** (`0.1.0`). This roadmap is directional, not a commitment — items and ordering will shift as the project and its users evolve. Feedback and contributions on any of these are welcome; open an issue to discuss before starting larger items.

**Legend:** 🔜 next up · 🛠 in design · 🔭 exploratory

---

## Reliability & polish (ongoing)

The current focus is making the core loop — create task → run agent → review → merge — fast and dependable before expanding surface area.

- **Performance pass** — consolidate the per-page polling into a single server-sent event channel so the UI updates live without the refetch chorus. Widen remaining poll intervals to fallback duty.
- **Spawn path hardening** — track in-flight background spawns so graceful shutdown can drain or kill them, preventing orphaned worktrees and zombie agent processes.
- **Migration reconciliation** — fold the accumulated runtime `ALTER TABLE` patches back into proper Drizzle migrations now that the toolchain blocker (Node < 24) is gone.
- **Spine test coverage** — an integration test over the spawn golden path plus a regression-test-per-bugfix policy, focused on the highest-churn orchestration code rather than blanket coverage.

## Agent Flows 🛠

Chain agents into reusable multi-step pipelines (e.g. plan → review → execute → critique). Building on the existing Pipelines feature:

- Visual editor (React Flow) for composing and reordering steps
- Per-step model/provider selection and checkpoint approvals between steps
- Shareable bundle export/import so flows can be published and reused

## Semantic memory 🔭

Replace keyword-based memory retrieval with vector similarity search. Pluggable embedding providers (Google Gemini Embedding, OpenAI, local models). Enables cross-modal search over attached PDFs and images, and more relevant context injection into agent prompts.

## Event-driven triggers 🔭

Automatic trigger/action rules built on the event channel above — e.g. `onFlowComplete → save memory`, `onTaskComplete → notify`. A no-code builder UI for wiring events to actions, turning Atlas from a manual hub into a reactive one.

## Remote access 🔭

Tunnel-based access to your local Atlas instance (e.g. via Tailscale) so you can check on running agents from another device. This raises the security bar — the always-mint localhost bootstrap and CORS-from-anywhere defaults will be revisited and hardened before any port is exposed.

## Authored diagrams 🔭

Draw flow/architecture diagrams in-app (React Flow), save them as project documents, `@`-mention them from tasks and chat, and expose them via MCP so third-party agents (Cursor, etc.) can read them as project context.

## Marketplace 🔭

Share and discover agents, skills, rules, and flow bundles. The route is reserved (`/marketplace`) and renders a placeholder today; set `VITE_ATLAS_MARKETPLACE_ENABLED=true` to preview the in-progress UI.

---

## Engineering chores

- **Bundle trim** — code-split heavy deps (mermaid and force-graph are already lazy; syntax-highlighter theme and the main chunk are next) and add explicit `manualChunks`.
- **End-to-end tests** — a Playwright pass over the critical flows that doubles as the demo-GIF recorder.

---

Have an idea or want to pick something up? Open an issue — see [CONTRIBUTING.md](../CONTRIBUTING.md).
