// React / library
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Lib
import { setApiKey } from '@/lib/api';

const STORAGE_KEY = 'atlas_api_key';

type AuthContextValue = {
  isAuthenticated: boolean;
  apiKey: string | null;
  setKey: (key: string) => void;
  clearKey: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setApiKey(stored);
    return stored;
  });

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

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!apiKey, apiKey, setKey, clearKey }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
