// FILE_PATH: packages/client/src/components/projects/create/last-parent-storage.ts

const LAST_PARENT_KEY = 'atlas_last_parent_path';

/**
 * Reads the most recently used parent folder for project scaffolding.
 *
 * Stored client-side so the user doesn't have to repick the same parent every
 * time they create a project. Safe to call during SSR / non-browser contexts.
 */
export function loadLastParent(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(LAST_PARENT_KEY) ?? '';
  } catch {
    return '';
  }
}

/** Persists the parent folder selection. Failures (quota, privacy mode) are ignored on purpose. */
export function saveLastParent(path: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_PARENT_KEY, path);
  } catch {
    // Ignored — non-critical UX nicety.
  }
}
