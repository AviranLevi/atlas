# CLAUDE.md

This project uses a shared AI agent configuration. All instructions, coding standards, and rules are maintained in:

- **`AGENTS.md`** — Project overview, architecture, commands, coding standards, and important context
- **`.ai/rules/`** — Detailed per-topic coding rules (services, routes, components, testing, etc.)
- **`DESIGN.md`** — Complete design system (colors, typography, components, spacing)
- **`CONTRIBUTING.md`** — Setup guide and development workflow
- **`MEMORIES.md`** — Detailed architecture, database schema, and project history

## Quick reference

```bash
pnpm dev          # start all packages
pnpm build        # full production build
pnpm lint         # Biome linter
pnpm typecheck    # TypeScript type-checking
pnpm test         # Vitest test suite
```

Monorepo: `packages/server` (Hono + Drizzle + SQLite, port 3100), `packages/client` (React + Vite + Tailwind, port 5173), `packages/shared` (Zod schemas).
