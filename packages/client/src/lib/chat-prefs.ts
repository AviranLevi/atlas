import type { ChatBackendType } from '@atlas/shared';

const KEYS = {
  lastBackendType: 'chat-prefs.lastBackendType',
  lastProviderId: 'chat-prefs.lastProviderId',
  lastExecutorId: 'chat-prefs.lastExecutorId',
  modelByProvider: (providerId: string) => `chat-prefs.modelByProvider.${providerId}`,
  modelByExecutor: (executorId: string) => `chat-prefs.modelByExecutor.${executorId}`,
} as const;

type ChatPrefsSnapshot = {
  lastBackendType: ChatBackendType | null;
  lastProviderId: string | null;
  lastExecutorId: string | null;
  modelByProvider: (providerId: string) => string | null;
  modelByExecutor: (executorId: string) => string | null;
};

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode or storage full — silently no-op */
  }
}

/** Returns a snapshot of all remembered chat preferences. */
export function getChatPrefs(): ChatPrefsSnapshot {
  const raw = safeGet(KEYS.lastBackendType);
  const lastBackendType: ChatBackendType | null = raw === 'api' || raw === 'cli' ? raw : null;

  return {
    lastBackendType,
    lastProviderId: safeGet(KEYS.lastProviderId),
    lastExecutorId: safeGet(KEYS.lastExecutorId),
    modelByProvider: (providerId) => safeGet(KEYS.modelByProvider(providerId)),
    modelByExecutor: (executorId) => safeGet(KEYS.modelByExecutor(executorId)),
  };
}

export function rememberBackendType(type: ChatBackendType): void {
  safeSet(KEYS.lastBackendType, type);
}

export function rememberProvider(providerId: string): void {
  safeSet(KEYS.lastProviderId, providerId);
}

export function rememberExecutor(executorId: string): void {
  safeSet(KEYS.lastExecutorId, executorId);
}

export function rememberModelForProvider(providerId: string, model: string): void {
  safeSet(KEYS.modelByProvider(providerId), model);
}

export function rememberModelForExecutor(executorId: string, model: string): void {
  safeSet(KEYS.modelByExecutor(executorId), model);
}
