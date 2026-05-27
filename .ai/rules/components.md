# Components

> Applies to: `packages/client/src/**/*.tsx`

## Placement

- Pages: `packages/client/src/pages/` -- top-level route views (`AgentsPage.tsx`, `KanbanPage.tsx`, etc.)
- UI primitives: `packages/client/src/components/ui/` (shadcn/ui components, generic, no business logic)
- Feature components: `packages/client/src/components/<feature>/` (business logic, dialogs, cards)
- Layout components: `packages/client/src/components/layout/` (AppShell, PageHeader)

## File Layout

Components are single-file. Types and constants are extracted to separate files per directory.

```
packages/client/src/
  pages/
    AgentsPage.tsx
    KanbanPage.tsx
    kanban-page.constants.ts
    SettingsPage.tsx
    settings-page.types.ts
    settings-page.constants.ts
    ...
  components/
    agents/
      agents.types.ts           ← all types for this directory
      agents.constants.ts       ← all constants for this directory
      AgentDialog.tsx
      AgentProviderDialog.tsx
    kanban/
      kanban.types.ts
      kanban.constants.ts
      KanbanCard.tsx
      KanbanColumn.tsx
      TaskDialog.tsx
    layout/
      index.ts                  ← barrel: re-exports all public components + shared types
      layout.types.ts           ← shared types used across sub-components
      layout.constants.ts       ← shared constants
      app-shell/
        AppShell.tsx
        app-shell.types.ts      ← AppShellProps + types for sub-components in this folder
        SidebarNavItem.tsx      ← sub-component only used by AppShell
      executor-popover/
        ExecutorPopover.tsx
        executor-popover.types.ts
        CopyCommand.tsx         ← sub-component only used by ExecutorPopover
      ...
    ui/
      button.tsx
      card.tsx
      ...
  lib/
    format.ts                   ← shared formatting utilities (timeAgo, calcDuration)
    utils.ts                    ← cn() and other generic utilities
    api.ts                      ← API client
```

### Nested component subfolders

When a feature component has one or more sub-components that are only used internally (not by other features), group them in a subfolder named after the parent:

```
<feature>/
  <Feature>.tsx               ← main exported component
  <feature>.types.ts          ← props for all components in this folder
  SubComponent.tsx            ← only used by <Feature>
```

Add a barrel `index.ts` at the feature root when the feature folder contains multiple public components (i.e., components imported by code outside the folder). The barrel re-exports all public components and any shared types.

## Component Structure (order matters)

1. Imports (React, types, hooks, components)
2. Component function (named export, not default)
3. Inside: hooks first, then handlers, then render

```tsx
import { useState } from 'react';
import type { AgentCardProps } from './AgentCard.types';
import { Badge } from '@/components/ui/badge';

export function AgentCard({ agent, onSelect }: AgentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
    onSelect(agent.id);
  };

  return (
    <div className="rounded-lg border p-4" onClick={handleToggle}>
      <h3 className="font-semibold">{agent.name}</h3>
      {isExpanded && <p className="text-muted-foreground">{agent.description}</p>}
    </div>
  );
}
```

## Styling

- Tailwind CSS utilities first. Always.
- Use shadcn/ui `cn()` utility for conditional classes.
- No inline styles. No CSS modules unless Tailwind is genuinely insufficient.

## Props

- Define props in the directory's `.types.ts` file (see `client-organization.md`).
- Props type named `ComponentNameProps` (e.g., `KanbanCardProps`, not `Props`).
- Import with `import type { ComponentNameProps } from './<directory>.types'`.
- Destructure props in the function signature.
- No `any` for props or state.

## Rules

- Named exports only (no `export default`).
- Keep components focused on a single responsibility.
- No direct API calls in components. Use TanStack Query hooks from `hooks/`.
- Interactive elements must be keyboard accessible.
- Provide `aria-label` for icon-only buttons.
