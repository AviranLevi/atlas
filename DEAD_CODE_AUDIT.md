# Atlas Dead Code Audit and Improvement Plan

## 1. Phase 1 — Dead Code Analysis


### Server (`packages/server`)

| File / Entity | Finding | Confidence | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| `src/controllers/index.ts` (line 1) | **Orphaned File**: Never imported. | High | Safe | Remove the entire `controllers/index.ts` file since routes import controllers directly. |
| `src/services/orchestrator/lifecycle/index.ts` (line 1) | **Orphaned File**: Never imported. | High | Safe | Remove the `lifecycle/index.ts` file, `orchestrator.service.ts` imports directly. |
| `src/services/orchestrator/review/index.ts` (line 1) | **Orphaned File**: Never imported. | High | Safe | Remove the `review/index.ts` file. |
| `tests/constants/index.ts` (line 1) | **Orphaned Files**: Never imported. | Medium | Safe | Review test suite. If factories and constants are not used in `tests/`, they should be deleted. |
| `@types/pdf-parse` (`packages/server/package.json` line 41) | **Unused Dependency**: Only imported via JS package. | High | Safe | Uninstall `@types/pdf-parse` from `packages/server`. |
| `src/services/worktree/index.ts` (lines 10) | **Unused Exports**: `WORKSPACES_DIR`, `DIFF_EXCLUDE_PATTERNS`, `DIFF_MAX_BUFFER`, `PER_FILE_LINE_CAP` | High | Safe | Remove these unused configuration exports, or consume them locally in the worktree service. |

*Note: MCP tool files in `src/mcp/` and SSE endpoints are intentionally excluded.*

### Client (`packages/client`)

| File / Entity | Finding | Confidence | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| `src/components/workspaces/WorkspaceCard.tsx` (line 21) | **Orphaned File**: Exported but never imported or used. | High | Safe | Remove `WorkspaceCard.tsx` and related type `WorkspaceCardProps`. |
| `src/components/workspaces/WorkspaceStatusPanel.tsx` (line 12) | **Orphaned File**: Exported but never imported or used. | High | Safe | Remove `WorkspaceStatusPanel.tsx`. |
| `src/components/settings/settings.types.ts` (line 1) | **Orphaned File**: Entirely unused types. | High | Safe | Remove the file. |
| `src/components/ui/index.ts` (line 1) | **Orphaned File**: Unused UI barrel file. | High | Safe | Remove barrel file; components are imported directly. |
| `src/pages/chat/components/ExecutionModeToggle.tsx` (line 41) | **Orphaned File**: Exported but never used. | High | Safe | Remove `ExecutionModeToggle.tsx`. |
| `src/pages/marketplace/components/MarketplaceFilters.tsx` (line 1) | **Orphaned File**: Never used. | High | Safe | Remove file. |
| `src/pages/marketplace/components/MarketplaceListingCard.tsx` (line 1) | **Orphaned File**: Never used. | High | Safe | Remove file. |
| `src/hooks/use-marketplace.hook.ts` (line 1) | **Orphaned File**: Never used. | High | Safe | Remove hook. |
| `src/components/layout/index.ts` (lines 3-6) | **Unused Exports**: `AgentStatusPanel`, `ExecutorPopover`, `PageHeader`, `ProjectTabBar` | High | Safe | Remove these barrel exports as they are unused. |
| `@radix-ui/react-separator` (`packages/client/package.json` line 26) | **Unused Dependencies**: Never imported. | High | Safe | Uninstall from `packages/client`. |
| `@radix-ui/react-dialog` (`src/components/ui/dialog/dialog.tsx` lines 89-97) | **Unused Exports**: `DialogClose`, `DialogOverlay`, `DialogPortal`, `DialogTrigger` | High | Safe | Remove unused component primitives from `dialog.tsx` and `sheet.tsx`. |

*Note: `@radix-ui/react-dropdown-menu`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, and `zod` are transitive dependencies required by `shadcn/ui` and `dnd-kit` internally or hookform/resolvers and are intentionally omitted from dead code findings.*

### Shared (`packages/shared`)

| File / Entity | Finding | Confidence | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| `packages/shared` barrel exports | **Unused Exports**: N/A | High | Safe | Knip analysis confirmed no unused exports in `packages/shared` that are not consumed by at least one side (client or server). No action required. |

### Root Package (`package.json`)

| File / Entity | Finding | Confidence | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| Root dependencies | **Unused Dependencies**: N/A | High | Safe | All dependencies in the root `package.json` (`concurrently`, `wait-on`, etc) are used in scripts. No action required. |

---

## 2. Phase 2 — Improvement Opportunities

### Overly Complex Functions & Files
* **`packages/server/src/services/package-io/package-importer.service.ts`**
  * **Finding**: `applyImport` and `previewImport` contain repetitive `if/else if` chains and deeply nested loops handling `skills`, `rules`, and `agents`. (Complexity > 100).
  * **Recommendation**: Refactor into separate handlers for each entity type or a strategy pattern to reduce cyclomatic complexity.

* **`packages/client/src/components/workspaces/StartWorkDialog.tsx`**
  * **Finding**: Large component (Complexity > 110) handling executor resolution, status logic, and forms.
  * **Recommendation**: Break down into smaller sub-components (e.g., `<ExecutorSelection />`, `<TaskSummary />`).

* **`packages/server/src/services/prompt-builder/prompt-sections.ts`**
  * **Finding**: Very long file (Complexity > 110) managing large static strings with inline variable substitutions.
  * **Recommendation**: Move templates to distinct `.txt` or `.md` template files and use a templating engine (or simple replace util) to load them.

### Type Safety Gaps
* **`packages/server/src/services/package-io/package-importer.service.ts`**
  * **Finding**: Heavy reliance on type assertions (`pkg.content as Record<string, unknown>`, `data.name as string`, and `... as never`).
  * **Recommendation**: Use `zod` to validate the incoming package structure dynamically instead of asserting.

* **`packages/client/src/components/memory/MemoryDialog.tsx`, `SkillDialog.tsx`, `PhaseDialog.tsx`**
  * **Finding**: Excessive use of inline type assertions in callbacks, e.g., `(v) => setType(v as MemoryType)`.
  * **Recommendation**: Update the UI primitive (e.g., `<Select onValueChange>`) to be strongly typed via generics, or safely cast inside a typed handler function.

* **`packages/server/src/services/quick-actions/quick-actions.service.ts`**
  * **Finding**: The constructor aggressively casts the repository: `this.repo as unknown as ResourceRepo<...>` due to mismatched types.
  * **Recommendation**: Align the repository interface with the `ResourceRepo` interface or use an adapter to prevent double casting `as unknown as Type`.

### Duplicate Logic
* **Repeated CRUD Hooks (`packages/client/src/hooks/`)**
  * **Finding**: A high level of duplication across the client's API hooks. The structure for `useUpdateX`, `useCreateX`, and `useDeleteX` is virtually identical across `use-tasks.hook.ts`, `use-projects.hook.ts`, `use-rules.hook.ts`, `use-skills.hook.ts`, `use-phases.hook.ts`, `use-memory.hook.ts`, `use-quick-actions.hook.ts`, etc. Every hook manually implements the `useMutation`, invalidates query keys, and throws identical `toast.error` / `toast.success` messages.
  * **Recommendation**: Consolidate using a generic hook factory: `function createCrudHooks<T>(resourcePath, queryKey)` that generates the `useGet`, `useCreate`, `useUpdate`, and `useDelete` functions to dry up ~15+ hook files.

* **Repetitive Error Handling (`packages/client/src/components/`)**
  * **Finding**: Forms consistently implement `{mutation.isError && <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>}`.
  * **Recommendation**: Create a centralized `<FormError error={mutation.error} />` component.
