# Client Coding Conventions

All code in `packages/client/src/` must follow these rules.

## Stack

React 19 + Vite + React Router 7 + TanStack React Query v5 + Tailwind CSS 4 + Radix UI (via `components/ui/`)

## Layer Architecture

```
pages/          → route components, compose features, no business logic
components/     → feature components (logic + UI)
components/ui/  → generic Radix/shadcn primitives (no domain logic)
hooks/          → all data fetching and business logic
contexts/       → global cross-feature shared state only
lib/            → api.ts, utils.ts, format.ts
```

- Components never call `api.*` directly — always go through hooks
- Pages only compose — no inline query calls

## Import Order

```typescript
// React / library    ← external npm (react, react-router-dom, lucide-react, etc.)
// Components         ← @/components/*
// Hooks              ← @/hooks/*
// Context            ← @/contexts/*
// Lib                ← @/lib/*
// Types              ← import type (always use `type` keyword)
// Constants          ← local .constants.ts
```

- Always `@/` alias for cross-feature imports — no `../../`
- Within the same feature folder, `./` relative imports are fine
- `import type` exclusively for all type imports

## Component Structure

Feature folder layout (flat, no index barrel):
```
components/<feature>/
  FeatureComponent.tsx
  feature.types.ts       ← all props + local types
  feature.constants.ts   ← all constants
```

File layout order:
1. Imports (by section above)
2. State (`useState`, custom hooks)
3. Derived values
4. Handlers (`useCallback`)
5. Render (`return`)

## 150-Line Rule

**A component over ~150 lines is a signal to review its responsibilities:**
- Extract logic → custom hook in `src/hooks/`
- Extract render section → sub-component in the same feature folder
- A long component that does one cohesive thing is fine to leave; one that mixes concerns must be split

## Hooks

File: `use-<resource>.hook.ts` in `src/hooks/`

```typescript
const AGENTS_KEY = ['agents'] as const;

export function useAgents() {
  return useQuery({ queryKey: AGENTS_KEY, queryFn: () => api.get<Agent[]>('/agents') });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAgent) => api.post<Agent>('/agents', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}
```

- One `*_KEY` const per resource at top of file
- Queries return raw `useQuery` result — don't destructure internally
- Mutations always invalidate on success
- JSDoc single-line on every exported hook: `/** Returns all agents. */`

## Forms

Individual `useState` per field — no form library. Manual inline validation.

```tsx
const [name, setName] = useState('');
const mutation = useCreateAgent();

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!name.trim()) return;
  mutation.mutate({ name }, { onSuccess: () => onOpenChange(false) });
};

<Button type="submit" disabled={mutation.isPending || !name.trim()}>
  {mutation.isPending ? 'Saving...' : 'Create'}
</Button>
{mutation.isError && <p className="text-destructive text-sm">{mutation.error.message}</p>}
```

- Close dialog in `onSuccess`, not after calling `mutate()`
- Always show errors — never silently swallow them

## Dialogs

Dialogs always receive `open`/`onOpenChange` as props — the **parent owns open state**. Never manage visibility internally.

```tsx
// Dialog
export function AgentDialog({ open, onOpenChange }: AgentDialogProps) {
  return <Dialog open={open} onOpenChange={onOpenChange}>...</Dialog>;
}

// Parent
const [isOpen, setIsOpen] = useState(false);
<AgentDialog open={isOpen} onOpenChange={setIsOpen} />
```

## Loading and Error States

- Page-level loading: `<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />` in `flex h-64 items-center justify-center`
- Panel-level loading: `<p className="text-sm text-muted-foreground">Loading...</p>` in `flex h-32 items-center justify-center`
- Error: always show a message + retry/back button — never silently render nothing
- Empty state: dashed border container with icon + text
- No skeleton loaders

## Real-Time / Polling

Use `refetchInterval` in React Query — not SSE. Only on queries that genuinely need live updates.

```typescript
return useQuery({ queryKey: [...KEY, id], queryFn: ..., refetchInterval: 3000 });
```

## useEffect Cleanup

Every effect that opens a listener, timer, or subscription must close it:

```typescript
useEffect(() => {
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);  // required
}, []);
```

## Styling

- Tailwind utilities only — no inline styles
- `cn()` from `@/lib/utils` for conditional classes
- `.css` file only for things Tailwind genuinely cannot do

## Types

- Domain types → always from `@my-agents/shared`
- Feature props/state → `feature.types.ts` alongside the component
- Always `import type` — never value-import a type
- Props interface named `<ComponentName>Props`
