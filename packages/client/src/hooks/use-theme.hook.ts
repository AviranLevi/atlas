import { useCallback, useSyncExternalStore } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

type ThemeState = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
};

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

function computeResolved(preference: ThemePreference): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return getSystemTheme();
}

function createInitialState(): ThemeState {
  const preference = readStoredPreference();
  return {
    preference,
    resolvedTheme: computeResolved(preference),
  };
}

const serverSnapshot: ThemeState = {
  preference: 'system',
  resolvedTheme: 'light',
};

let state: ThemeState =
  typeof window !== 'undefined' ? createInitialState() : serverSnapshot;

function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

if (typeof window !== 'undefined') {
  applyTheme(state.resolvedTheme);
}

const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', () => {
    if (state.preference !== 'system') return;
    const next = getSystemTheme();
    if (next === state.resolvedTheme) return;
    state = { preference: 'system', resolvedTheme: next };
    applyTheme(next);
    listeners.forEach((cb) => cb());
  });
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): ThemeState {
  return state;
}

function getServerSnapshot(): ThemeState {
  return serverSnapshot;
}

function setTheme(pref: ThemePreference): void {
  state = {
    preference: pref,
    resolvedTheme: computeResolved(pref),
  };
  localStorage.setItem(STORAGE_KEY, pref);
  applyTheme(state.resolvedTheme);
  listeners.forEach((cb) => cb());
}

export function useTheme(): {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (pref: ThemePreference) => void;
  theme: ResolvedTheme;
  toggleTheme: () => void;
} {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setThemePref = useCallback((pref: ThemePreference) => {
    setTheme(pref);
  }, []);
  const toggleTheme = useCallback(() => {
    setTheme(snapshot.resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [snapshot.resolvedTheme]);
  return {
    preference: snapshot.preference,
    resolvedTheme: snapshot.resolvedTheme,
    setTheme: setThemePref,
    theme: snapshot.resolvedTheme,
    toggleTheme,
  };
}
