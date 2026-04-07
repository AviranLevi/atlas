# Changelog

All notable changes to Atlas will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
