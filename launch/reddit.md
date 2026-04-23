# Reddit Launch Posts

## Target subreddits (ranked)

1. **r/LocalLLaMA** — biggest win, loves local-first, OSS, multi-provider
2. **r/ChatGPTCoding** — devs using AI for coding, high relevance
3. **r/selfhosted** — local-first angle fits perfectly
4. **r/programming** — tough crowd, must be substantive
5. **r/opensource** — smaller but friendly
6. **r/webdev** — decent fit for dashboard + Kanban
7. **r/commandline** — CLI agents angle

## Avoid
- r/artificial — too generic, low dev audience
- r/MachineLearning — wrong crowd, downvotes tools
- Any subreddit with <10k members (no reach)

---

## r/LocalLLaMA post

**Title:** Atlas — open-source local-first dashboard for managing AI coding agents (Claude Code, Aider, Ollama, +more)

**Body:**

Built this over the past few months because I couldn't keep track of what my different coding agents were doing.

Atlas is a local dashboard that:
- Runs Claude Code, Aider, Gemini CLI, Codex, Amp, OpenCode, Goose, or Ollama on your tasks
- Isolates each run in a git worktree
- Streams agent output live
- Shows diffs with review + inline comments
- Supports MCP so agents get project context (rules, skills, memory)

Everything is local. SQLite DB, no cloud, no telemetry.

**Ollama-specific:** built-in support for Qwen 2.5 Coder, DeepSeek R1, Gemma 3, Llama 3.2, Phi-4, Code Llama. Pulls via Aider under the hood. Fully offline.

MIT licensed. Looking for feedback.

GitHub: https://github.com/AviranLevi/atlas

---

## r/ChatGPTCoding post

**Title:** Open-sourced Atlas — a Kanban-style orchestrator for AI coding agents (multi-agent, MCP support)

**Body:**

I was bouncing between Claude Code for big refactors, Aider for tight pair-programming loops, and Gemini CLI for cheap tasks. Lost track of what ran where.

Atlas is a local-first dashboard that unifies this:

- Kanban board per project
- Assign tasks to any supported agent
- Agent runs in isolated git worktree
- MCP integration for Claude Code + Gemini CLI (project rules, skills, memory auto-injected)
- Diff review with inline comments + AI reviewer
- Workflow mode: brainstorm → plan → execute with approval gates

Stack: TS, Hono, SQLite, React, Tailwind.

MIT. Alpha, would love testers.

GitHub: https://github.com/AviranLevi/atlas

---

## r/selfhosted post

**Title:** Atlas — self-hosted dashboard for managing local AI coding agents

**Body:**

Lightweight self-hosted Node.js app for orchestrating AI coding agents on your own hardware.

- One-command install: `pnpm install && pnpm dev`
- SQLite, no external DB
- No telemetry, no cloud dependency
- Runs agents (Claude Code, Aider, Gemini CLI, Ollama, etc.) in isolated git worktrees on your projects
- Full Kanban UI at localhost:5173

MIT, open source.

https://github.com/AviranLevi/atlas

---

## Tips for Reddit

- Post at 8-10am ET weekdays
- One subreddit at a time, 24h gap between (avoid auto-mod spam flags)
- Read subreddit rules, many ban self-promotion without flair
- Never use same exact title/body across subs (shadowban risk)
- Respond to every comment within 2 hours of posting
- Never argue, even with hostile comments — disengage
