// External
import type { Context, MiddlewareHandler, Next } from 'hono';

/**
 * Allowlist for `Origin` and `Host` headers on auth endpoints.
 *
 * IPv6 `[::1]` is included because some browsers / Node clients resolve
 * `localhost` to `::1` and the resulting headers reflect that.
 *
 * TODO(remote-access): once Tailscale / tunnel mode lands, this allowlist
 * needs an env-driven extension so trusted remote hosts can hit `/auth/*`.
 */
const ORIGIN_ALLOWLIST = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
const HOST_ALLOWLIST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

/**
 * Hardens an unauthenticated route against drive-by access from the LAN
 * and from cross-origin web pages (DNS rebinding included).
 *
 * Defense layering:
 *   1. **Origin (primary)** — a rebound `evil.com` carries `Origin: http://evil.com`.
 *      Allowlist rejects it. This is the strongest signal because the browser
 *      sets it and a malicious page cannot forge it cross-origin.
 *   2. **Host (backup)** — catches the dual-spoof case where a non-browser
 *      caller forges a localhost-looking Origin header but the request URL
 *      itself targets a non-local host.
 *
 * Missing `Origin` is treated as failure: legitimate browser POSTs always
 * send `Origin`. Server-to-server callers should authenticate with a
 * Bearer token via the regular `authMiddleware` instead of this path.
 */
export const localOnly: MiddlewareHandler = async (c: Context, next: Next) => {
  const origin = c.req.header('Origin');
  if (!origin || !ORIGIN_ALLOWLIST.test(origin)) {
    return c.json({ error: 'Forbidden: localhost origin required' }, 403);
  }

  const host = c.req.header('Host');
  if (!host || !HOST_ALLOWLIST.test(host)) {
    return c.json({ error: 'Forbidden: localhost host required' }, 403);
  }

  return next();
};
