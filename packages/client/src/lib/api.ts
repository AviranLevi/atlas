const BASE_URL = '/api/v1';

let _apiKey: string | null = null;

/** Sets the API key used for all subsequent requests. */
export function setApiKey(key: string | null): void {
  _apiKey = key;
}

/** Returns the current API key. */
export function getApiKey(): string | null {
  return _apiKey;
}

export class ApiError extends Error {
  status: number;
  /**
   * Server-provided structured payload (e.g. `{ agentName, taskCount }` on a
   * 409 RESTRICT block). Lets callers render precise UI without parsing the
   * message string.
   */
  details?: Record<string, unknown>;
  constructor(message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(_apiKey ? { Authorization: `Bearer ${_apiKey}` } : {}),
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    const errorMsg =
      typeof body.error === 'string'
        ? body.error
        : typeof body.message === 'string'
          ? body.message
          : `HTTP ${res.status}`;
    const details =
      body && typeof body.details === 'object' && body.details !== null
        ? (body.details as Record<string, unknown>)
        : undefined;
    throw new ApiError(errorMsg, res.status, details);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
  /** Raw streaming POST -- returns the Response for manual body reading. */
  stream: (path: string, data: unknown, signal?: AbortSignal): Promise<Response> =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(_apiKey ? { Authorization: `Bearer ${_apiKey}` } : {}),
      },
      body: JSON.stringify(data),
      signal,
    }),
  /** Fire-and-forget DELETE (e.g. abort stream). Logs errors instead of swallowing. */
  fireAndForget: (path: string, method: string = 'DELETE'): void => {
    fetch(`${BASE_URL}${path}`, {
      method,
      headers: _apiKey ? { Authorization: `Bearer ${_apiKey}` } : {},
    }).catch((err) => {
      console.warn(`[api] fire-and-forget ${method} ${path} failed:`, err);
    });
  },
};
