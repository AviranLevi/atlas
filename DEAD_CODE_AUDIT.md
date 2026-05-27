# Dead Code Audit & Improvement Plan - Atlas

## 1. `@atlas/shared` (Shared Package)

### Unused Code (Exports / Types)
`knip` and manual analysis did not find explicitly unused exports from `packages/shared`. As noted in the architecture documentation, barrel exports (`src/index.ts`) may export schemas used exclusively on the client or server. Since there are no strict unused exports detected, we consider the shared package export map clean.

### Improvement Opportunities (Type Safety & Inconsistencies)
- **Path:** `packages/shared/src/schemas/workspaces.schema.ts:73`
  **Finding:** Use of `z.record(z.any())` or empty object schemas.
  **Confidence:** Low/Medium
  **Recommended Action:** Replace `z.any()` with `z.unknown()` inside record schemas for better type safety.
  **Impact:** Safe to refactor to `unknown` with type narrowing.

- **Path:** `packages/shared/src/strip-cli-prompt-echo.ts:35`
  **Finding:** Usage of type assertion `as`.
  **Confidence:** Low
  **Recommended Action:** Look into removing `as` assertion or confirming it is absolutely necessary.
  **Impact:** Low risk but improves TS strictness.

## 2. `@atlas/server` (Server Package)

### Unused Exports & Types
- **Path:** `packages/server/src/mcp-http.ts`
  **Finding:** `MCP_ENABLED_PREF`
  **Confidence:** High
  **Recommended Action:** Remove unused constant.
  **Impact:** Safe to remove.

- **Path:** `packages/server/src/services/orchestrator/shared/index.ts`
  **Finding:** `clearEntryTimers`, `isShuttingDown`
  **Confidence:** High
  **Recommended Action:** Remove unused functions.
  **Impact:** Safe to remove.

- **Path:** `packages/server/src/db/index.ts`
  **Finding:** `schema`
  **Confidence:** Low
  **Recommended Action:** Verify if this is an expected export for Drizzle Kit. If not used, remove.
  **Impact:** Safe if not required by `drizzle.config.ts`.

### Orphaned / Unused Endpoints
- **Analysis:** Endpoints related to `packages` (`/api/v1/packages/export/skill/:id`) and SSE connections were manually verified. They are either invoked directly via `window.open` or `EventSource`, bypassing standard `api.get` imports. No explicit dead endpoints were found that could safely be removed with high confidence.

### Improvement Opportunities (Type Safety & Complex Functions)
- **Path:** `packages/server/src/services/chat/chat.service.ts` (444 lines) & `packages/server/src/services/prompt-builder/prompt-sections.ts` (416 lines)
  **Finding:** Overly complex files/functions.
  **Confidence:** High
  **Recommended Action:** Refactor `chat.service.ts` to split logic into smaller helpers or use-case-specific services. Consolidate prompt-building logic.
  **Impact:** Needs careful verification but significantly improves maintainability.

- **Path:** `packages/server/src/controllers/workspaces.controller.ts:215`
  **Finding:** Widespread usage of `catch (error: unknown)` followed by generic type assertions.
  **Confidence:** Medium
  **Recommended Action:** Standardize error handling using `AppError` inside controllers.
  **Impact:** Refactoring error catching reduces type-safety gaps.

- **Path:** `packages/server/src/services/agents/agents.service.ts:180`
  **Finding:** Type assertion `resolvedSkills as Record<string, unknown>[]`
  **Confidence:** Medium
  **Recommended Action:** Refactor to properly parse types with Zod instead of casting with `as`.
  **Impact:** Safe to fix via explicit parsing.

## 3. `@atlas/client` (Client Package)

### Unused Dependencies
- **Path:** `packages/client/package.json`
  **Finding:** Unused dependencies: `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-separator`, `zod`
  **Confidence:** High
  **Recommended Action:** Remove these from `package.json` using `pnpm remove`.
  **Impact:** Safe to remove. Zod might be used via shared, but direct client dependency is unused.

### Unused Exports & Components
- **Path:** `packages/client/src/components/layout/index.ts`
  **Finding:** Unused exports `AgentStatusPanel`, `ExecutorPopover`, `PageHeader`, `ProjectTabBar`
  **Confidence:** High
  **Recommended Action:** Remove or verify if they are meant to be re-exported for future use.
  **Impact:** Safe.

- **Path:** `packages/client/src/lib/tours/tour-registry.ts`
  **Finding:** Unused export `TOUR_LOADERS`
  **Confidence:** High
  **Recommended Action:** Remove.
  **Impact:** Safe.

- **Path:** `packages/client/src/hooks/use-workspaces.hook.ts`
  **Finding:** Unused export `useActiveWorkspaceForTask`
  **Confidence:** High
  **Recommended Action:** Remove if unused across the client.
  **Impact:** Safe.

### Improvement Opportunities (Overly Complex Components)
- **Path:** `packages/client/src/components/projects/ProjectDialog.tsx` (314 lines), `packages/client/src/components/workspaces/StartWorkDialog.tsx` (311 lines)
  **Finding:** Overly complex React components.
  **Confidence:** High
  **Recommended Action:** Extract inner forms, state logic (into custom hooks), or sub-components.
  **Impact:** Low risk UI refactoring.

- **Path:** `packages/client/src/hooks/use-workspaces-mutations.hook.ts` (310 lines)
  **Finding:** Large hook file.
  **Confidence:** High
  **Recommended Action:** Split mutations by entity or domain sub-topic.
  **Impact:** Safe refactor.
