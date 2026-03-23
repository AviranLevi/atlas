# Hooks and TanStack React Query — Detailed Reference

## Hook File Template

```typescript
// React / library
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { Resource, CreateResource, UpdateResource } from '@my-agents/shared';

const RESOURCE_KEY = ['resource'] as const;

/** Returns all resources. */
export function useResources() {
  return useQuery({
    queryKey: RESOURCE_KEY,
    queryFn: () => api.get<Resource[]>('/resources'),
  });
}

/** Returns a single resource by ID. */
export function useResource(id: string) {
  return useQuery({
    queryKey: [...RESOURCE_KEY, id],
    queryFn: () => api.get<Resource>(`/resources/${id}`),
    enabled: Boolean(id),
  });
}

/** Creates a new resource. */
export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateResource) => api.post<Resource>('/resources', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: RESOURCE_KEY }),
  });
}

/** Updates a resource by ID. */
export function useUpdateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResource }) =>
      api.put<Resource>(`/resources/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: RESOURCE_KEY }),
  });
}

/** Deletes a resource by ID. */
export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/resources/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: RESOURCE_KEY }),
  });
}
```

## Query Key Conventions

```typescript
// Single resource list
const AGENTS_KEY = ['agents'] as const;

// Single item (always derived from list key)
queryKey: [...AGENTS_KEY, id]

// Filtered list (add filter params as part of the key)
queryKey: [...TASKS_KEY, { projectId, status }]
```

Always define the root key as a `const` tuple at the top of the hook file. This ensures all related queries and mutations share the same key prefix, so invalidating `AGENTS_KEY` correctly refetches all agent queries.

## Using Hooks in Components

```tsx
export function AgentList() {
  const { data: agents = [], isLoading } = useAgents();
  const deleteAgent = useDeleteAgent();

  if (isLoading) return <Spinner />;

  return (
    <ul>
      {agents.map((agent) => (
        <li key={agent.id}>
          {agent.name}
          <Button onClick={() => deleteAgent.mutate(agent.id)}>Delete</Button>
        </li>
      ))}
    </ul>
  );
}
```

**Rules:**
- Default the data to `[]` or appropriate empty value when destructuring: `data: agents = []`
- Use `isPending` (not `isLoading`) for mutation state
- Call `mutate()` for fire-and-forget; `mutateAsync()` when you need to `await` the result

## Mutations with Async/Await

For cases where you need to wait for a mutation to navigate or show a success state:

```tsx
const createAgent = useCreateAgent();

const handleSubmit = async (data: CreateAgent) => {
  try {
    const agent = await createAgent.mutateAsync(data);
    navigate(`/agents/${agent.id}`);
  } catch {
    // error is also in createAgent.error
  }
};
```

## Invalidating Related Queries

When a mutation affects multiple resources, invalidate all affected keys:

```typescript
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTask) => api.post<Task>('/tasks', data),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: TASKS_KEY });
      // Also invalidate project summary (task counts change)
      if (task.projectId) {
        qc.invalidateQueries({ queryKey: [...PROJECTS_KEY, task.projectId] });
      }
    },
  });
}
```

## Polling for Real-Time Data

The codebase uses React Query's `refetchInterval` for live data — not SSE or WebSockets. Add `refetchInterval` to any query that needs to stay fresh while the user is on the page:

```typescript
/** Returns a workspace with its current status, polling every 3 seconds. */
export function useWorkspaceStatus(id: string | undefined) {
  return useQuery({
    queryKey: [...WORKSPACES_KEY, id],
    queryFn: () => api.get<Workspace>(`/workspaces/${id}`),
    enabled: Boolean(id),
    refetchInterval: 3000,
    retry: (failureCount, error) => {
      // Don't retry 404s — the resource is genuinely gone
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 3;
    },
  });
}
```

React Query handles the polling lifecycle automatically — no manual cleanup needed.

**When to use `refetchInterval`:** Only for resources that change server-side while the user is watching (running workspaces, in-progress tasks). Don't add it to static data queries.

---

## Non-Query Hooks (useEffect)

For pure logic that doesn't use React Query (timers, DOM event listeners, third-party subscriptions), follow the same naming convention:

```typescript
// hooks/use-window-size.hook.ts
export function useWindowSize() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);   // ← always clean up
  }, []);

  return { width };
}
```

**`useEffect` cleanup checklist** — if the effect does any of the following, it **must** return a cleanup function:

| Opens... | Clean up with... |
|----------|-----------------|
| `addEventListener` | `removeEventListener` |
| `setInterval` / `setTimeout` | `clearInterval` / `clearTimeout` |
| An `EventSource` | `es.close()` |
| A third-party subscription | `subscription.unsubscribe()` or equivalent |
| A mutable `isMounted` flag | Set `isMounted = false` |

Effects that only set state or read data need no cleanup.

## API Wrapper

All requests go through `api` from `@/lib/api`:

```typescript
api.get<T>(path)           // GET
api.post<T>(path, body)    // POST
api.put<T>(path, body)     // PUT
api.patch<T>(path, body)   // PATCH
api.delete(path)           // DELETE
```

Never use `fetch` directly in hooks or components.
