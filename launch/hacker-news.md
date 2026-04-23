# Hacker News — Show HN Post

## Title (under 80 chars, no emoji, no clickbait)

**Show HN: Atlas — Local-first hub for managing AI coding agents**

Alternatives if title rejected:
- Show HN: Atlas — Orchestrate Claude Code, Aider, Gemini CLI from a Kanban board
- Show HN: A local-first dashboard for your AI coding agents

## URL

https://github.com/AviranLevi/atlas

## Post body (first comment — HN convention)

Hi HN — I built Atlas because I kept losing track of what my coding agents were doing across projects.

You create tasks on a Kanban board, assign them to an agent (Claude Code, Aider, Gemini CLI, Codex, Goose, OpenCode, Ollama), and Atlas:

- Spawns the agent CLI in an isolated git worktree inside your project
- Injects the project's rules/skills/memory via MCP (for agents that support it)
- Streams the agent output back to the UI
- Moves the task to Review when done, with a diff viewer and approval flow

Why local-first: everything runs on your machine. SQLite database, no cloud, no telemetry. Your code and API keys never leave your laptop.

Why multi-agent: different agents are good at different things. Claude Code is strongest for large refactors, Aider excels at pair-programming flow, local Ollama models work offline. Atlas lets you pick per-task without rewriting your setup.

What's working today:
- 8 executors (Claude Code, Aider, Codex, Gemini CLI, Amp, OpenCode, Goose, Ollama)
- MCP integration for Claude Code + Gemini CLI (project context flows into agents)
- Kanban + per-project workflow modes (brainstorm → plan → execute with approval gates)
- Chat interface to create tasks via natural language
- Diff review with inline comments + AI reviewer

Stack: TypeScript, Hono, SQLite (Drizzle), React, Tailwind, Vite.

MIT licensed. Would love feedback on the workflow model and which executors you'd want added.

---

## Tips for HN launch

- Post Tuesday-Thursday, 8-10am PT (peak US traffic)
- Do NOT share to friends/Twitter for first 30 min (flags algo)
- Respond to every comment within first 2 hours
- Don't defend, clarify. Take criticism gracefully.
- If it drops off front page, don't repost for at least 30 days
