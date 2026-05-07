// React / library
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

// Lib
import { setApiKey } from '@/lib/api';

const STORAGE_KEY = 'atlas_api_key';

type AuthContextValue = {
  isAuthenticated: boolean;
  apiKey: string | null;
  setKey: (key: string) => void;
  clearKey: () => void;
  /** True for one render after a fresh `/auth/bootstrap` succeeded. Consumers consume + acknowledge. */
  justBootstrapped: boolean;
  acknowledgeBootstrap: () => void;
  /** True when the server has keys but this browser has none — needs CLI reset to recover. */
  needsRecovery: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Silently bootstraps an API key on first load when localStorage is empty.
 *
 * Why this lives in the AuthProvider rather than a dedicated hook:
 *   - The same effect that decides whether to call `/auth/bootstrap` also
 *     owns the `apiKey` state and the localStorage write. Splitting it
 *     across files invites races between mount-order and storage writes.
 *   - The bootstrap endpoint is gated by a localhost-only middleware on
 *     the server (`packages/server/src/lib/local-only.ts`). Production
 *     bundles served from `localhost:3100` and dev bundles served from
 *     `localhost:5173` both satisfy that origin check; remote-access /
 *     tunnel modes will need to extend the server allowlist before this
 *     call works from outside the box.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setApiKey(stored);
    return stored;
  });
  const [justBootstrapped, setJustBootstrapped] = useState(false);
  const [needsRecovery, setNeedsRecovery] = useState(false);
  const bootstrapAttempted = useRef(false);

  const setKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
    setApiKeyState(key);
  }, []);

  const clearKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey(null);
    setApiKeyState(null);
  }, []);

  const acknowledgeBootstrap = useCallback(() => setJustBootstrapped(false), []);

  useEffect(() => {
    if (apiKey) return;
    // Guard against StrictMode double-effects and re-renders racing two POSTs.
    // The server side is idempotent (409 on the second call), but a duplicate
    // 201 followed by a 409 would briefly flip needsRecovery to true.
    if (bootstrapAttempted.current) return;
    bootstrapAttempted.current = true;

    let cancelled = false;
    // Track whether the fetch reached a terminal state (success, 409, 403, error).
    // If cleanup fires before completion (React 19 StrictMode unmounts the effect
    // on first mount then remounts it), we reset bootstrapAttempted so the second
    // mount can retry — otherwise apiKey stays null forever.
    let completed = false;

    (async () => {
      try {
        const res = await fetch('/api/v1/auth/bootstrap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (cancelled) return;
        if (res.status === 201) {
          const body = (await res.json()) as { rawKey?: string };
          if (body.rawKey) {
            setKey(body.rawKey);
            setJustBootstrapped(true);
          }
          completed = true;
          return;
        }
        if (res.status === 409) {
          // Defensive: the server currently always mints a fresh key (201),
          // but if the endpoint is ever tightened to reject duplicates again
          // (e.g. remote-access mode), this branch recovers gracefully.
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            setKey(stored);
          } else {
            setNeedsRecovery(true);
          }
          completed = true;
          return;
        }
        // 403 (origin rejected), 500, network — terminal; leave key null so the
        // rest of the app behaves as it always did when unauthenticated. The user
        // can still hit Settings → API Keys once a key exists, and `localOnly`
        // misconfiguration surfaces as a hard 403 the dev will see in Network.
        completed = true;
      } catch {
        // Network error — terminal fallback.
        completed = true;
      }
    })();

    return () => {
      cancelled = true;
      // If the fetch didn't finish before cleanup ran, allow the next mount to retry.
      if (!completed) bootstrapAttempted.current = false;
    };
  }, [apiKey, setKey]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!apiKey,
      apiKey,
      setKey,
      clearKey,
      justBootstrapped,
      acknowledgeBootstrap,
      needsRecovery,
    }),
    [apiKey, setKey, clearKey, justBootstrapped, acknowledgeBootstrap, needsRecovery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
