# Product Hunt Launch

## Name
Atlas

## Tagline (60 chars max)
Local-first hub for your AI coding agents

Alternatives:
- Manage Claude Code, Aider & more from one dashboard
- Kanban for AI coding agents
- Orchestrate every AI coding agent in one place

## Description (260 chars for preview)

Atlas is an open-source, local-first dashboard for managing AI coding agents. Create tasks on a Kanban board, assign them to Claude Code, Aider, Gemini CLI, Ollama, or others, and review the diffs — all without leaving your machine.

## Full description

**The problem**
Every AI coding agent lives in its own terminal. You lose track of what each one did, can't compare outputs, and have no shared context across projects.

**What Atlas does**
A single local dashboard for running and reviewing AI coding agents:

✓ Kanban task board with project context
✓ Spawns agents in isolated git worktrees
✓ 8+ executors supported (Claude Code, Aider, Codex, Gemini CLI, Amp, OpenCode, Goose, Ollama)
✓ MCP integration — agents access your project's rules, skills, and memory
✓ Diff review with inline comments and AI reviewer
✓ Brainstorm → Plan → Execute workflow with approval gates
✓ Chat to create tasks in natural language

**Privacy first**
Everything runs on your machine. SQLite DB, no cloud, no telemetry. Your code and API keys never leave your laptop.

**Open source**
MIT licensed. Built with TypeScript, Hono, React, Tailwind.

## Topics/Categories
- Developer Tools
- Artificial Intelligence
- Open Source
- Productivity

## Gallery assets needed
1. Hero shot — Kanban board with active workspace
2. Agent output streaming view (live block renderer)
3. Diff review page with inline comments
4. Settings → executors page showing all supported agents
5. Demo GIF (30-60s of full task flow)

## Maker comment (first reply to your own post)

Hey Product Hunt 👋 — I'm Aviran, maker of Atlas.

I built this because I have 4 different AI coding agents installed and no way to know which one worked best on which task. Claude Code is great, Aider is great, local Ollama models are great when I'm offline — but there was no unified way to USE them.

Atlas treats each agent as a pluggable executor. You create a task, pick the agent (or let the project default decide), and Atlas handles the git worktree, context injection via MCP, and diff review.

Would love feedback on:
1. Which executors you'd want added next
2. The workflow mode (brainstorm → plan → execute) — useful or overkill?
3. Feature gaps vs tools like Plandex, Claude Dev, etc.

Thanks for checking it out!

---

## Tips for PH launch

- Launch at 12:01am PT for full 24-hour window
- Tuesday-Thursday best days
- Prep hunters 1 week ahead
- Supporters: share to Twitter, LinkedIn, Discord communities
- Respond to every comment
- Don't ask for upvotes directly (ToS violation)
