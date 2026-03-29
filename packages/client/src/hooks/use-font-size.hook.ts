import { useCallback, useSyncExternalStore } from 'react';

export type FontSize = 'sm' | 'md' | 'lg';

const STORAGE_KEY = 'font-size';
const DEFAULT: FontSize = 'md';

function readStored(): FontSize {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'sm' || stored === 'md' || stored === 'lg') return stored;
  return DEFAULT;
}

function applyFontSize(size: FontSize): void {
  const root = document.documentElement;
  root.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg');
  root.classList.add(`font-size-${size}`);
}

let currentSize: FontSize = typeof window !== 'undefined' ? readStored() : DEFAULT;

if (typeof window !== 'undefined') {
  applyFontSize(currentSize);
}

const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): FontSize {
  return currentSize;
}

function getServerSnapshot(): FontSize {
  return DEFAULT;
}

function setFontSizeGlobal(size: FontSize): void {
  currentSize = size;
  localStorage.setItem(STORAGE_KEY, size);
  applyFontSize(size);
  listeners.forEach((cb) => cb());
}

/** Returns the current font size preference and a setter. */
export function useFontSize(): {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
} {
  const fontSize = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeGlobal(size);
  }, []);
  return { fontSize, setFontSize };
}
