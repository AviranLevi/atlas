// External
import type { Context, MiddlewareHandler, Next } from 'hono';

// Services
import { authService } from '../services/index.js';

const DEV_BYPASS = process.env.ATLAS_AUTH_BYPASS === 'true';

/** Validates Bearer token on all protected routes. Bypassed in dev when ATLAS_AUTH_BYPASS=true. */
export const authMiddleware: MiddlewareHandler = async (c: Context, next: Next) => {
  if (DEV_BYPASS) return next();

  const header = c.req.header('Authorization') ?? '';
  const raw = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!raw) return c.json({ error: 'Unauthorized' }, 401);

  const apiKey = await authService.validateKey(raw);
  if (!apiKey) return c.json({ error: 'Unauthorized' }, 401);

  return next();
};
