# Client-Side Organization

> Applies to: `packages/client/src/**/*.{ts,tsx}`

## Types

- **Never** define types inline in component files.
- Extract all types to a `<directory>.types.ts` file in the same directory.
- Props types must be named `ComponentNameProps` (e.g., `KanbanCardProps`, `AgentDialogProps`).
- Use `type` keyword, not `interface`.
- Import with `import type { ... } from './<directory>.types'`.

```
components/
  kanban/
    kanban.types.ts        ← KanbanCardProps, KanbanColumnProps, TaskDialogProps
    KanbanCard.tsx
    KanbanColumn.tsx
    TaskDialog.tsx
```

```tsx
// kanban.types.ts
import type { Task, TaskPriority, TaskEstimate } from '@atlas/shared';

export type KanbanCardProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  activeWorkspaceId?: string;
};
```

## Constants

- **Never** define constants, config objects, or enums inline in component files.
- Extract to a `<directory>.constants.ts` file in the same directory.
- True constants use `UPPER_SNAKE_CASE`. Config/mapping objects use `camelCase`.
- Import with `import { ... } from './<directory>.constants'`.

```tsx
// kanban.constants.ts
export const PRIORITIES = ['High', 'Medium', 'Low'] as const;
export const NONE_VALUE = '__none__';

export const priorityBadgeClass: Record<string, string> = {
  High: 'border-red-200 bg-red-50 text-red-700 ...',
  Medium: '...',
  Low: '...',
};
```

## Shared Utilities

- Reusable formatting functions (e.g., `timeAgo`, `calcDuration`) go in `packages/client/src/lib/`.
- Do not redefine the same utility in multiple files.

```
lib/
  format.ts       ← timeAgo(), calcDuration()
  utils.ts        ← cn() (already exists)
  api.ts          ← API client (already exists)
```

## Page Files

- Each page lives in its **own subfolder** under `pages/`, named with kebab-case matching the page.
- Types go in `<page-name>.types.ts`, constants in `<page-name>.constants.ts` — inside the same subfolder.
- The page component file keeps its PascalCase name (e.g., `KanbanPage.tsx`).

```
pages/
  kanban/
    KanbanPage.tsx
    kanban-page.constants.ts
  settings/
    SettingsPage.tsx
    settings-page.types.ts
    settings-page.constants.ts
  workspaces/
    WorkspacesPage.tsx
    workspaces-page.types.ts
    workspaces-page.constants.ts
```

- In `App.tsx`, import pages from their subfolder: `import { KanbanPage } from '@/pages/kanban/KanbanPage'`.

## What Stays in the Component File

- The component function itself
- Local state (`useState`, `useRef`)
- Event handlers
- Memoized values
- JSX render logic
- Small, single-use helper components that are tightly coupled (e.g., a `StatusIcon` used only by its parent)
