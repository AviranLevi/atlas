// FILE_PATH: packages/client/src/components/projects/create/use-auto-open-editor-pref.ts

// Hooks
import { usePreferences } from '@/hooks/use-preferences.hook';

const PREF_KEY = 'auto_open_editor_on_create';

/**
 * Returns whether the user wants newly-created projects to auto-open in their editor.
 *
 * Backed by the generic `preferences` key-value table. Defaults to `false` until the
 * Settings UI lands (M7) and lets the user flip it. The call site here exists so the
 * preference takes effect the moment it's set, with no further plumbing required.
 */
export function useAutoOpenEditorPref(): boolean {
  const { data } = usePreferences();
  return data?.[PREF_KEY] === 'true';
}
