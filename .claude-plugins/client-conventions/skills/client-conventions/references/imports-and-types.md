# Imports and Types — Detailed Reference

## Import Section Order

Use section comments. Include only sections that apply — omit empty ones entirely.

```
// React / library      ← external npm packages
// Components           ← @/components/*
// Hooks                ← @/hooks/*
// Context              ← @/contexts/*
// Lib                  ← @/lib/*
// Types                ← import type (both @my-agents/shared and local)
// Constants            ← local .constants.ts imports
```

## Section-by-Section Rules

### `// React / library`

All external npm packages: React hooks, React Router, TanStack Query, Radix, lucide-react, dnd-kit, zod, etc.

```typescript
// React / library
import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, TrashIcon } from 'lucide-react';
```

### `// Components`

Local components using the `@/` alias. UI primitives first, then feature components.

```typescript
// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AgentCard } from '@/components/agents/AgentCard';
```

### `// Hooks`

Custom hooks from `src/hooks/`.

```typescript
// Hooks
import { useAgents, useCreateAgent } from '@/hooks/use-agents.hook';
import { useTasks } from '@/hooks/use-tasks.hook';
```

### `// Context`

Context hooks from `src/contexts/`.

```typescript
// Context
import { useActiveProject } from '@/contexts/ProjectContext';
```

### `// Lib`

Utility functions from `src/lib/`.

```typescript
// Lib
import { cn } from '@/lib/utils';
import { formatDate, formatStatus } from '@/lib/format';
```

### `// Types`

**Always use `import type`** — never import types as values. Combine shared and local types in one section.

```typescript
// Types
import type { Agent, Task } from '@my-agents/shared';
import type { AgentDialogProps } from './agents.types';
```

### `// Constants`

Local constants from `.constants.ts` files. External constant-like values (enums from libraries) go in `// React / library`.

```typescript
// Constants
import { AGENT_ROLES, DEFAULT_AGENT_NAME } from './agents.constants';
import { COLUMN_ORDER } from './kanban-page.constants';
```

---

## Path Alias Rules

Always use `@/` for imports from `src/`. Never use relative paths like `../../` that cross feature boundaries.

```typescript
// ✓ correct
import { Button } from '@/components/ui/button';
import { useAgents } from '@/hooks/use-agents.hook';

// ✗ incorrect — relative path crossing feature boundaries
import { Button } from '../../../components/ui/button';
```

**Exception:** Within the same feature folder, relative imports are allowed and preferred:

```typescript
// ✓ correct — within components/agents/
import type { AgentDialogProps } from './agents.types';
import { AGENT_ROLES } from './agents.constants';
```

---

## Types Placement

| Type category | Where it lives |
|---------------|----------------|
| Domain entities (`Agent`, `Task`, `Project`) | `@my-agents/shared` |
| Feature props and local state shapes | `<feature>.types.ts` alongside the component |
| Page-specific types | `<feature>-page.types.ts` alongside the page |
| Context value types | Inline in the context file or a sibling `types.ts` |
| Hook return types | Inferred — only export if shared across files |

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Component file | PascalCase | `AgentDialog.tsx` |
| Feature types file | `<feature>.types.ts` | `agents.types.ts` |
| Feature constants file | `<feature>.constants.ts` | `agents.constants.ts` |
| Page types file | `<feature>-page.types.ts` | `agents-page.types.ts` |
| Hook file | `use-<resource>.hook.ts` | `use-agents.hook.ts` |
| Context file | PascalCase | `ProjectContext.tsx` |
| Props interface | `<ComponentName>Props` | `AgentDialogProps` |
| Query key constant | `<RESOURCE>_KEY` | `AGENTS_KEY` |

---

## Banned Patterns

| Banned | Correct alternative |
|--------|---------------------|
| `import type AgentDialogProps from ...` without `type` keyword | `import type { AgentDialogProps } from ...` |
| Relative `../../` paths across feature boundaries | `@/` alias |
| `import * as Radix from '@radix-ui/...'` in feature code | Import from `@/components/ui/*` |
| `fetch(...)` directly in a component or hook | `api.get/post/put/delete` from `@/lib/api` |
| `style={{ ... }}` inline styles | Tailwind classes |
| Types defined inline in component file for shared props | `feature.types.ts` |
| `any` for props or state | Explicit types or generics |
