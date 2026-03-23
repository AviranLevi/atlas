---
name: client-conventions
description: This skill should be used when the user asks to "add a component", "create a hook", "add a page", "create a context", "add a feature", "write client code", "build a UI", or when writing or modifying any file inside packages/client/src/. Provides the complete coding conventions for the my-agents client: layer architecture, component/page structure, hook patterns, import sections, context usage, and type placement.
version: 1.0.0
---

# Client Coding Conventions — my-agents

This skill governs all code written in `packages/client/src/`. Apply these rules whenever creating or editing components, hooks, pages, contexts, or lib utilities.

## Stack

- **React 19** + **Vite** + **React Router 7**
- **TanStack React Query v5** — all server state
- **Tailwind CSS 4** — all styling (no inline styles)
- **Radix UI** wrapped as shadcn-style components in `components/ui/`
- **Path alias**: always use `@/` for local imports (never relative `../../`)

---

## Layer Architecture

```
pages/          → route-level components, compose features
components/     → feature components (business logic + UI)
components/ui/  → generic UI primitives (no business logic)
hooks/          → data fetching and business logic
contexts/       → shared cross-feature state
lib/            → utilities (api.ts, utils.ts, format.ts)
```

**Rules:**
- Components never call `api.*` directly — all data access goes through hooks
- Pages only compose components; they don't own query state directly
- `components/ui/` primitives have no knowledge of domain types
- Contexts are for global shared state only — local UI state stays in components

---

## Import Section Order

Every file uses section comments. Include only sections that apply — omit empty ones.

```typescript
// React / library
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { AgentCard } from '@/components/agents/AgentCard';

// Hooks
import { useAgents, useCreateAgent } from '@/hooks/use-agents.hook';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

// Lib
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';

// Types
import type { Agent } from '@my-agents/shared';
import type { AgentDialogProps } from './agents.types';

// Constants
import { AGENT_ROLES } from './agents.constants';
```

**Rules:**
- `// React / library` always first — external npm packages only
- `// Types` uses `import type` exclusively — never import types without the `type` keyword
- `// Constants` always last when present
- `@/` alias on all local imports — no relative `../` paths except within the same feature folder
- Within the same feature folder, relative imports (`./`) are allowed and preferred

---

## Component Structure

### Folder layout

Each feature area in `components/` has a flat folder:

```
components/agents/
├── AgentDialog.tsx          ← component file
├── AgentCard.tsx            ← related component
├── agents.types.ts          ← all TypeScript types for this feature
├── agents.constants.ts      ← all constants for this feature
```

No `index.ts` barrel. Import by the full path: `@/components/agents/AgentDialog`.

### File layout (order matters)

```tsx
// React / library
// Components
// Hooks
// Context
// Lib
// Types
// Constants

// Local types (if small and single-use)
interface LocalState { ... }

export function AgentDialog({ agentId, onClose }: AgentDialogProps) {
  // 1. Hooks (useState, useQuery, custom hooks)
  const [name, setName] = useState('');
  const { data: agent } = useAgent(agentId);

  // 2. Derived values / memos
  const isEditing = Boolean(agentId);

  // 3. Handlers
  const handleSubmit = useCallback(() => { ... }, []);

  // 4. Render
  return ( ... );
}
```

### Component size rule

**If a component exceeds ~150 lines, treat it as a signal to review its responsibilities.**

Before adding more code to a long component, ask:
- Can logic be extracted into a custom hook?
- Can a section of the render be its own sub-component in the same folder?
- Is this component doing more than one thing?

A long component that does one thing well (e.g., a complex form) is acceptable. A long component that mixes data fetching, business logic, and multiple UI concerns should be split.

Common splits:
```
AgentDialog.tsx          → AgentDialog.tsx (shell, < 80 lines)
                           AgentForm.tsx    (form fields)
                           useAgentForm.ts  (form state + validation logic)
```

---

## Hooks

### File naming

`use-<resource>.hook.ts` — always in `src/hooks/`.

### Structure

```typescript
// React / library
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { Agent, CreateAgent, UpdateAgent } from '@my-agents/shared';

// ─── Query key ───────────────────────────────────────────────────────────────

const AGENTS_KEY = ['agents'] as const;

// ─── Query hooks ─────────────────────────────────────────────────────────────

/** Returns all agents. */
export function useAgents() {
  return useQuery({
    queryKey: AGENTS_KEY,
    queryFn: () => api.get<Agent[]>('/agents'),
  });
}

/** Returns a single agent by ID. */
export function useAgent(id: string) {
  return useQuery({
    queryKey: [...AGENTS_KEY, id],
    queryFn: () => api.get<Agent>(`/agents/${id}`),
    enabled: Boolean(id),
  });
}

// ─── Mutation hooks ──────────────────────────────────────────────────────────

/** Creates a new agent. */
export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAgent) => api.post<Agent>('/agents', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}

/** Updates an agent by ID. */
export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgent }) =>
      api.put<Agent>(`/agents/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}

/** Deletes an agent by ID. */
export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/agents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}
```

**Rules:**
- One `*_KEY` constant per resource, used by all related hooks
- Query hooks return the raw `useQuery` result — don't destructure internally
- Mutations always invalidate the relevant query key on success
- `enabled: Boolean(id)` for queries that depend on a param
- JSDoc on every exported hook function (single-line)

---

## Pages

Pages live in `src/pages/<feature>/`. Same colocation rules as components:

```
pages/agents/
├── AgentsPage.tsx
├── agents-page.types.ts      ← kebab-case for page-specific files
├── agents-page.constants.ts
```

Pages only compose components — no inline query calls, no business logic:

```tsx
export function AgentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div>
      <PageHeader title="Agents" action={<Button onClick={() => setIsDialogOpen(true)}>Add</Button>} />
      <AgentList />
      <AgentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
```

---

## Forms

Forms use individual `useState` per field — no form library. Validation is manual, inline, and minimal.

```tsx
const [name, setName] = useState('');
const [role, setRole] = useState('');

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!name.trim()) return;           // guard — no submit if invalid
  createAgent.mutate({ name, role }, {
    onSuccess: () => onOpenChange(false),
  });
};

<Button type="submit" disabled={isPending || !name.trim()}>
  {isPending ? 'Saving...' : 'Create'}
</Button>
```

**Rules:**
- Disable the submit button when `isPending` or required fields are empty
- Close the dialog in `onSuccess` — not after `mutate()` returns
- Show mutation errors inline below the submit button: `{mutation.isError && <p className="text-destructive text-sm">{mutation.error.message}</p>}`
- Never silently swallow errors — if a form can fail, show the error

---

## Loading and Error States

**Loading** — use `Loader2` spinner for page-level, inline text for panel-level:

```tsx
// Page level
if (isLoading) {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// Panel / list level
{isLoading ? (
  <div className="flex h-32 items-center justify-center">
    <p className="text-sm text-muted-foreground">Loading...</p>
  </div>
) : ( /* content */ )}
```

**Error** — always show something; never silently fail:

```tsx
if (error || !data) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <p className="text-sm text-muted-foreground">Something went wrong.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
}
```

**Empty state** — use a dashed border card with a descriptive message:

```tsx
{items.length === 0 && (
  <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
    <Icon className="h-8 w-8 text-muted-foreground" />
    <p className="text-sm text-muted-foreground">No items yet.</p>
  </div>
)}
```

No skeleton loaders — use spinner or text placeholders.

---

## Dialog Open-State Ownership

Dialogs always receive `open` and `onOpenChange` as props — the **parent owns the open state**. Dialogs never manage their own visibility.

```tsx
// ✓ correct — dialog is controlled by parent
export function AgentDialog({ open, onOpenChange, agent }: AgentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      ...
    </Dialog>
  );
}

// Parent
const [isOpen, setIsOpen] = useState(false);
<AgentDialog open={isOpen} onOpenChange={setIsOpen} agent={agent} />
```

This makes dialogs predictable, testable, and prevents state conflicts when a parent needs to open/close them programmatically.

---

## Context

Use Context only for cross-feature global state that can't be in React Query (e.g., active project selection). Don't put server state in Context.

```typescript
// ProjectContext.tsx
const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useActiveProject(): ProjectContextValue {
  const value = useContext(ProjectContext);
  if (!value) throw new Error('useActiveProject must be used inside ProjectProvider');
  return value;
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  // ...
  return <ProjectContext.Provider value={...}>{children}</ProjectContext.Provider>;
}
```

---

## Types

- Shared domain types (`Agent`, `Task`, etc.) → always import from `@my-agents/shared`
- Feature-specific types (props, local state shapes, dialog props) → `feature.types.ts` alongside the component
- Always `import type` — never a value import for types

---

## Additional Resources

- **`references/hooks-and-query.md`** — TanStack Query patterns, cache invalidation, optimistic updates
- **`references/components-and-pages.md`** — Component splitting guide, size rule examples, page composition
- **`references/imports-and-types.md`** — Full import ordering rules, type placement, naming conventions
