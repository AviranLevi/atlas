# Components and Pages — Detailed Reference

## Component Folder Structure

```
components/<feature>/
├── FeatureComponent.tsx          ← primary component
├── FeatureSubPart.tsx            ← sub-component (if needed)
├── feature.types.ts              ← all props/types for this feature
├── feature.constants.ts          ← all constants for this feature
```

No `index.ts`. Import directly: `import { FeatureComponent } from '@/components/feature/FeatureComponent'`

## Page Folder Structure

```
pages/<feature>/
├── FeaturePage.tsx
├── feature-page.types.ts         ← kebab-case for page-specific files
├── feature-page.constants.ts
```

## Full Component Template

```tsx
// React / library
import { useState, useCallback } from 'react';
import { PlusIcon } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Hooks
import { useCreateAgent, useUpdateAgent } from '@/hooks/use-agents.hook';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { Agent, CreateAgent } from '@my-agents/shared';
import type { AgentDialogProps } from './agents.types';

// Constants
import { AGENT_ROLES } from './agents.constants';

export function AgentDialog({ agentId, open, onOpenChange }: AgentDialogProps) {
  // 1. State
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('');

  // 2. Hooks
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();

  // 3. Derived values
  const isEditing = Boolean(agentId);
  const isPending = createAgent.isPending || updateAgent.isPending;

  // 4. Handlers
  const handleSubmit = useCallback(async () => {
    if (isEditing) {
      await updateAgent.mutateAsync({ id: agentId!, data: { name, role } });
    } else {
      await createAgent.mutateAsync({ name, role });
    }
    onOpenChange(false);
  }, [isEditing, agentId, name, role, createAgent, updateAgent, onOpenChange]);

  // 5. Render
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Agent' : 'New Agent'}</DialogTitle>
        </DialogHeader>
        {/* form content */}
        <Button onClick={handleSubmit} disabled={isPending}>
          {isEditing ? 'Save' : 'Create'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

## The 150-Line Rule — How to Split

When a component grows past ~150 lines, review whether it's doing more than one thing. Use this decision tree:

### Case 1: Mixed logic + render → extract a hook

```tsx
// BEFORE: AgentDialog.tsx (200 lines, mixes form logic with render)
export function AgentDialog({ agentId }: AgentDialogProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [errors, setErrors] = useState({});
  const createAgent = useCreateAgent();
  // 30 more lines of form logic...
  return ( /* 100+ lines */ );
}

// AFTER: extract the form logic
// hooks/use-agent-form.hook.ts
export function useAgentForm(agentId?: string) {
  const [name, setName] = useState('');
  // ... all form state and validation
  return { name, setName, role, setRole, errors, handleSubmit, isPending };
}

// components/agents/AgentDialog.tsx (~60 lines)
export function AgentDialog({ agentId, open, onOpenChange }: AgentDialogProps) {
  const form = useAgentForm(agentId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AgentForm {...form} />
    </Dialog>
  );
}
```

### Case 2: Multiple render sections → extract sub-components

```tsx
// BEFORE: WorkspacePage.tsx (220 lines, renders 3 distinct panels)

// AFTER: split into focused components in the same folder
// pages/workspaces/WorkspacePage.tsx (~50 lines, pure composition)
export function WorkspacePage() {
  const { workspaceId } = useParams();
  return (
    <div className="flex gap-4">
      <WorkspaceOutputPanel workspaceId={workspaceId} />
      <WorkspaceDiffPanel workspaceId={workspaceId} />
      <WorkspaceActionsPanel workspaceId={workspaceId} />
    </div>
  );
}
// pages/workspaces/WorkspaceOutputPanel.tsx
// pages/workspaces/WorkspaceDiffPanel.tsx
// pages/workspaces/WorkspaceActionsPanel.tsx
```

### When NOT to split

- The component is long but handles a single cohesive concern (e.g., a complex table with column definitions)
- Splitting would require prop-drilling through 3+ levels
- The sub-pieces would never be reused and add file overhead without clarity gain

## Dialog Open-State Ownership

All dialogs and sheets are **parent-controlled** — they receive `open` and `onOpenChange` as props. Never manage visibility internally.

```tsx
// agents.types.ts
export interface AgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent;
}

// AgentDialog.tsx — correct
export function AgentDialog({ open, onOpenChange, agent }: AgentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>...</DialogContent>
    </Dialog>
  );
}

// Parent — owns the state
const [isOpen, setIsOpen] = useState(false);
<AgentDialog open={isOpen} onOpenChange={setIsOpen} agent={selectedAgent} />
```

This lets the parent open or close the dialog programmatically (e.g., after navigation, on keyboard shortcut) without fighting internal state.

---

## Form Pattern

Forms use individual `useState` per field. No form library. Validation is minimal and manual.

```tsx
export function AgentDialog({ open, onOpenChange, agent }: AgentDialogProps) {
  const [name, setName] = useState(agent?.name ?? '');
  const [role, setRole] = useState(agent?.role ?? '');

  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const isEditing = Boolean(agent);
  const isPending = createAgent.isPending || updateAgent.isPending;
  const error = createAgent.error || updateAgent.error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (isEditing) {
      updateAgent.mutate({ id: agent!.id, data: { name, role } }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createAgent.mutate({ name, role }, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}
          <Button type="submit" disabled={isPending || !name.trim()}>
            {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Rules:**
- Close the dialog in `onSuccess` — not synchronously after calling `mutate()`
- Disable submit when `isPending` or required fields are empty
- Always render mutation errors below the submit button — never silently swallow them
- Reset field state when the dialog closes (`useEffect` on `open` if needed)

---

## Loading and Error State Patterns

### Page-level loading

```tsx
if (isLoading) {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
```

### Page-level error

```tsx
if (error || !data) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <p className="text-sm text-muted-foreground">Something went wrong.</p>
      <Button variant="outline" size="sm" onClick={() => navigate(-1)}>Go back</Button>
    </div>
  );
}
```

### Panel / list loading

```tsx
{isLoading ? (
  <div className="flex h-32 items-center justify-center">
    <p className="text-sm text-muted-foreground">Loading...</p>
  </div>
) : content}
```

### Empty state

```tsx
{items.length === 0 && (
  <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
    <SomeIcon className="h-8 w-8 text-muted-foreground" />
    <p className="text-sm text-muted-foreground">No items yet.</p>
  </div>
)}
```

**Consistency rules:**
- Page-level: `Loader2` spinner in a centered `h-64` container
- Panel-level: inline text (`"Loading..."`) in a centered `h-32` container
- No skeleton loaders
- Always show an error state — never silently render nothing when a query fails

---

## UI Components (components/ui/)

Radix UI primitives are wrapped in `components/ui/` as shadcn-style components. Use these exclusively — don't import Radix primitives directly in feature components.

```tsx
// ✓ correct
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// ✗ incorrect — don't import Radix directly in feature code
import * as Dialog from '@radix-ui/react-dialog';
```

## Styling Rules

- Tailwind utilities only — no inline styles
- Use `cn()` from `@/lib/utils` for conditional class names
- Add a `.css` file only when Tailwind is genuinely insufficient (e.g., complex keyframe animations)

```tsx
// ✓ correct
<div className={cn('flex items-center gap-2', isActive && 'bg-accent')}>

// ✗ incorrect
<div style={{ display: 'flex', gap: '8px' }}>
```

## Props and Types

Define props in the feature's `.types.ts` file:

```typescript
// agents.types.ts
export interface AgentDialogProps {
  agentId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface AgentCardProps {
  agent: Agent;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}
```

Don't define props inline in the component file unless the type is genuinely single-use and trivial.
