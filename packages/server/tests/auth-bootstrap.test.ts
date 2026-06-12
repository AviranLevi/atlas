/**
 * Auth bootstrap + localhost-only middleware tests.
 *
 * Three surfaces under test:
 *
 *   1. `localOnly` middleware — Origin and Host header allowlist. The pin is
 *      that DNS-rebinding (where the rebound origin is `evil.com`) and dual-spoof
 *      (forged Origin + non-local Host) both fail closed. If a future refactor
 *      relaxes either check, these tests catch it.
 *
 *   2. `AuthService.bootstrapKey` — always mints a fresh key. A browser that
 *      lost its localStorage is indistinguishable from a first-time install,
 *      and the endpoint is gated by `localOnly`, so the security boundary is
 *      the network check, not key scarcity. (Previously the second call threw
 *      409 ALREADY_INITIALIZED; that gate was removed deliberately.)
 *
 *   3. End-to-end: a minimal Hono app that wires `localOnly` in front of the
 *      bootstrap call. Same shape as production, but assembled inline so we
 *      don't pay the cost of importing every `services/index.ts` member just
 *      to assert a 403.
 *
 * Hermetic: nothing here touches `data/agents.db`. The `apiKeysRepository`
 * import inside `AuthService` is replaced with an in-memory store via
 * `vi.mock` (hoisted above the static import below).
 */
import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../src/lib/errors.js';
import { localOnly } from '../src/lib/local-only.js';

// In-memory key store shared with the mocked repository barrel. Reset in
// beforeEach so each test sees a fresh "no keys yet" world.
type StoredKey = {
  id: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};
const fakeKeyStore: StoredKey[] = [];

vi.mock('../src/db/repositories/index.js', () => ({
  apiKeysRepository: {
    findAll: () =>
      fakeKeyStore.map((r) => ({
        id: r.id,
        name: r.name,
        keyPrefix: r.keyPrefix,
        createdAt: r.createdAt,
        lastUsedAt: r.lastUsedAt,
      })),
    findByHash: (hash: string) => fakeKeyStore.find((r) => r.keyHash === hash) ?? null,
    insert: (data: Omit<StoredKey, 'lastUsedAt'>) => {
      fakeKeyStore.push({ ...data, lastUsedAt: null });
    },
    updateLastUsed: () => {
      /* noop in tests */
    },
    remove: (id: string) => {
      const i = fakeKeyStore.findIndex((r) => r.id === id);
      if (i >= 0) fakeKeyStore.splice(i, 1);
    },
  },
}));

// Pulled in AFTER vi.mock so the transitive `apiKeysRepository` reference
// resolves to the in-memory mock above.
const { AuthService } = await import('../src/services/auth/auth.service.js');

beforeEach(() => {
  fakeKeyStore.length = 0;
});

describe('localOnly middleware', () => {
  function pingApp() {
    return new Hono().get('/ping', localOnly, (c) => c.text('ok'));
  }

  async function ping(headers: Record<string, string>) {
    return pingApp().request('/ping', { headers });
  }

  it('accepts dev origin http://localhost:5173', async () => {
    const res = await ping({ Origin: 'http://localhost:5173', Host: 'localhost:3100' });
    expect(res.status).toBe(200);
  });

  it('accepts http://127.0.0.1:3100', async () => {
    const res = await ping({ Origin: 'http://127.0.0.1:3100', Host: '127.0.0.1:3100' });
    expect(res.status).toBe(200);
  });

  it('accepts IPv6 localhost http://[::1]:5173', async () => {
    const res = await ping({ Origin: 'http://[::1]:5173', Host: '[::1]:3100' });
    expect(res.status).toBe(200);
  });

  it('rejects non-local origin (DNS rebinding case)', async () => {
    const res = await ping({ Origin: 'http://evil.com', Host: 'localhost:3100' });
    expect(res.status).toBe(403);
  });

  it('rejects missing Origin (curl from anywhere)', async () => {
    const res = await ping({ Host: 'localhost:3100' });
    expect(res.status).toBe(403);
  });

  it('rejects LAN host even with localhost-shaped origin (dual-spoof)', async () => {
    // Attacker forges Origin to slip past the primary check; Host backup catches
    // it because the request URL itself targets a non-local host.
    const res = await ping({ Origin: 'http://localhost:5173', Host: 'evil.com:3100' });
    expect(res.status).toBe(403);
  });

  it('rejects LAN host with no Origin (curl from a peer)', async () => {
    const res = await ping({ Host: '192.168.1.5:3100' });
    expect(res.status).toBe(403);
  });
});

describe('AuthService.bootstrapKey', () => {
  it('first call mints a key with the fixed default name', async () => {
    const svc = new AuthService();
    const result = await svc.bootstrapKey();
    expect(result.rawKey).toMatch(/^atlas_[A-Za-z0-9_-]+$/);
    expect(result.apiKey.name).toBe('Browser default');
    expect(fakeKeyStore.length).toBe(1);
  });

  it('second call mints another fresh key (no ALREADY_INITIALIZED gate)', async () => {
    const svc = new AuthService();
    const first = await svc.bootstrapKey();
    const second = await svc.bootstrapKey();

    expect(second.rawKey).toMatch(/^atlas_[A-Za-z0-9_-]+$/);
    expect(second.rawKey).not.toBe(first.rawKey);
    expect(fakeKeyStore.length).toBe(2);
  });

  it('keysExist reflects state', async () => {
    const svc = new AuthService();
    expect(await svc.keysExist()).toBe(false);
    await svc.bootstrapKey();
    expect(await svc.keysExist()).toBe(true);
  });
});

describe('end-to-end: localOnly + bootstrap handler', () => {
  // Replays the exact composition from the production route in a minimal
  // app, so the LAN-hole regression test exercises the same wiring without
  // importing the rest of the services barrel.
  function makeApp() {
    const svc = new AuthService();
    const app = new Hono();
    app.onError((err, c) => {
      if (err instanceof AppError) {
        const body: { error: string; details?: Record<string, unknown> } = { error: err.message };
        if (err.cause && typeof err.cause === 'object' && !(err.cause instanceof Error)) {
          body.details = err.cause as Record<string, unknown>;
        }
        return c.json(body, err.status as 400 | 403 | 404 | 409 | 500);
      }
      return c.json({ error: 'Internal server error' }, 500);
    });
    app.post('/api/v1/auth/bootstrap', localOnly, async (c) => {
      const result = await svc.bootstrapKey();
      return c.json({ ...result.apiKey, rawKey: result.rawKey }, 201);
    });
    // Stand-in for `POST /auth/keys` create — same `localOnly` gate as the real route.
    app.post('/api/v1/auth/keys', localOnly, async (c) => {
      const result = await svc.bootstrapKey();
      return c.json({ ...result.apiKey, rawKey: result.rawKey }, 201);
    });
    return app;
  }

  const localHeaders = {
    Origin: 'http://localhost:5173',
    Host: 'localhost:3100',
    'Content-Type': 'application/json',
  };

  it('first POST /auth/bootstrap → 201 with rawKey', async () => {
    const app = makeApp();
    const res = await app.request('/api/v1/auth/bootstrap', { method: 'POST', headers: localHeaders });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { rawKey: string; name: string };
    expect(body.rawKey).toMatch(/^atlas_/);
    expect(body.name).toBe('Browser default');
  });

  it('second POST /auth/bootstrap → 201 with a fresh key (always-mint)', async () => {
    const app = makeApp();
    const first = await app.request('/api/v1/auth/bootstrap', { method: 'POST', headers: localHeaders });
    expect(first.status).toBe(201);
    const firstBody = (await first.json()) as { rawKey: string };

    const second = await app.request('/api/v1/auth/bootstrap', { method: 'POST', headers: localHeaders });
    expect(second.status).toBe(201);
    const secondBody = (await second.json()) as { rawKey: string };
    expect(secondBody.rawKey).toMatch(/^atlas_/);
    expect(secondBody.rawKey).not.toBe(firstBody.rawKey);
  });

  it('rejects bootstrap from a non-localhost origin (DNS rebinding)', async () => {
    const app = makeApp();
    const res = await app.request('/api/v1/auth/bootstrap', {
      method: 'POST',
      headers: { Origin: 'http://evil.com', Host: 'localhost:3100', 'Content-Type': 'application/json' },
    });
    expect(res.status).toBe(403);
    expect(fakeKeyStore.length).toBe(0);
  });

  // Regression for the pre-fix LAN hole: anyone on the network used to be able
  // to POST /auth/keys against a default-bound dev server with no Origin.
  it('rejects POST /auth/keys from a LAN peer (closed hole)', async () => {
    const app = makeApp();
    const res = await app.request('/api/v1/auth/keys', {
      method: 'POST',
      headers: { Host: '192.168.1.5:3100', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'pwn' }),
    });
    expect(res.status).toBe(403);
    expect(fakeKeyStore.length).toBe(0);
  });
});
