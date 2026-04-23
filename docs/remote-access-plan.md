# Remote Access — Feature Plan

> Scope spec for Cursor / implementer. Describes **what** and **why**. Implementer produces the step-by-step execution plan.

## 1. Goal

Let a user reach their locally-running Atlas instance from anywhere (phone, other laptop, co-worker's machine) without standing up custom infrastructure, while keeping the project 100% open-source and self-hostable.

Designed in two phases:

- **Phase 1 — Tunnel mode (MVP).** User's machine exposes itself via a tunnel provider they choose (`cloudflared`, `ngrok`, `tailscale funnel`, `bore`, plain LAN). Atlas never touches user traffic.
- **Phase 2 — Atlas Cloud relay (optional, future).** A hosted relay (`relay.atlas.app` or similar) that proxies requests to a registered local instance over an outbound websocket. Users who don't want to run a tunnel themselves can opt in. The local codebase must stay functional without it.

The architecture in Phase 1 must leave a clean seam for Phase 2 — the same auth model, same API surface, same session/token semantics. Only the transport changes.

## 2. Non-goals

- Multi-tenant hosting of user data. Atlas Cloud is a relay, never a data store.
- Built-in VPN. Users who want a VPN can run Tailscale themselves.
- Mobile app. Remote access = same web UI in a mobile browser.
- Realtime collaboration (multi-user editing same task). Single-operator remote, one session at a time in Phase 1.
- SSO / OAuth providers in Phase 1. Bearer token only.

## 3. Guiding principles

1. **User owns the exposure.** Remote access is off by default. Enabling it is explicit, visible, and revocable in one click.
2. **Secrets never leave the machine unencrypted.** Tokens are generated locally, shown once, hashed in the DB (same pattern as existing `api_keys` table).
3. **No telemetry, no phone-home.** Tunnel mode is fully offline from Atlas's perspective — we just spawn a child process the user already trusts.
4. **Pluggable transport.** Tunnel provider and (future) relay client are behind a `RemoteTransport` interface. Adding a new provider = new adapter, no core changes.
5. **Fail closed.** If remote mode is on but auth middleware can't validate, return 401. Never fall back to the dev `ATLAS_AUTH_BYPASS` shortcut when a request arrives from a non-loopback origin.
6. **OSS-friendly.** No paid SDKs, no closed binaries bundled. Tunnel providers are invoked as user-installed CLIs.

## 4. Phase 1 — Tunnel mode

### 4.1 User flow

1. User opens **Settings → Remote Access**.
2. Toggles "Enable remote access". UI warns: "This exposes Atlas to the internet. A token is required for all requests."
3. Picks a provider: `cloudflared` (recommended default, no account needed for quick tunnels), `ngrok`, `tailscale funnel`, `custom` (user pastes their own public URL), or `lan-only` (bind to 0.0.0.0, no tunnel).
4. Clicks **Start tunnel**.
   - Atlas checks the chosen CLI is on `PATH`. If not, shows install instructions and aborts.
   - Atlas spawns the CLI as a child process, parses stdout for the public URL.
   - Atlas generates a **remote access token** (scope: `remote`), shows it to the user **once**, and writes the hash to `api_keys`.
5. UI displays: public URL, QR code, the token, and a **Stop** button.
6. User opens the URL on their other device, enters the token when prompted by the client, client stores it in `localStorage`, all subsequent requests carry `Authorization: Bearer <token>`.
7. **Stop** sends SIGTERM to the tunnel child, revokes the token row (or keeps it, user choice — see 4.6).

### 4.2 Server changes

#### 4.2.1 New schema — `remote_sessions`

```
id                text pk
provider          text  -- 'cloudflared' | 'ngrok' | 'tailscale' | 'custom' | 'lan'
publicUrl         text
status            text  -- 'starting' | 'active' | 'stopped' | 'error'
apiKeyId          text fk -> api_keys.id
startedAt         text
stoppedAt         text
lastError         text
```

One row per tunnel lifecycle. History is useful for audit ("when was I exposed?").

#### 4.2.2 Extend `api_keys`

Add columns:

- `scope text not null default 'local'` — values: `local`, `remote`, `cloud` (future).
- `expiresAt text` — optional TTL.
- `revokedAt text` — soft revoke; middleware checks `revokedAt is null`.

Scoped keys let the same auth middleware enforce different policies per origin. Local-only keys reject requests that arrive via the tunnel.

#### 4.2.3 New service — `remoteAccessService`

Location: `packages/server/src/services/remote-access/`.

Responsibilities:

- `start(config)` — spawn tunnel child, parse URL, insert `remote_sessions` row, generate scoped api key, return `{ publicUrl, token, sessionId }`.
- `stop(sessionId)` — SIGTERM child (mirror `orchestrator` shutdown ordering), update status, optionally revoke key.
- `current()` — return active session or null.
- `onChildExit` — if child dies unexpectedly, mark session `error`, emit activity log entry.

Pluggable provider adapters under `services/remote-access/providers/`:

```
providers/
  cloudflared.provider.ts
  ngrok.provider.ts
  tailscale.provider.ts
  custom.provider.ts
  lan.provider.ts
  types.ts          // RemoteTransport interface
```

Each adapter: `spawn(): ChildProcess`, `parseUrl(stdout: string): string | null`, `healthCheck(): Promise<boolean>`.

Follow existing service conventions (`FILE_PATH`, `FUNCTION_NAME`, try/catch, logger, `AppError`).

#### 4.2.4 New routes — `/api/v1/remote`

- `GET /remote/status` — current session.
- `POST /remote/start` — body: `{ provider, providerConfig? }`. Returns `{ publicUrl, token, sessionId }`. Token is only returned on start, never listed.
- `POST /remote/stop` — stops the active session.
- `GET /remote/sessions` — history list.
- `GET /remote/providers` — returns installed/available providers (checks `PATH`).

All under existing `authMiddleware`. The `start` endpoint also requires the caller to be on loopback (see 4.4).

#### 4.2.5 Auth middleware changes

Extend `lib/auth-middleware.ts`:

- Determine request origin: `loopback` (127.0.0.1 / ::1 / unix socket) vs `remote`.
- On `remote`, require a key with `scope in ('remote', 'cloud')`.
- On `remote`, **never** honor `ATLAS_AUTH_BYPASS`.
- Update `api_keys.lastUsedAt`.
- Rate-limit per token: 60 req/10s sliding window, in-memory Map (good enough for Phase 1; Redis-optional later).

#### 4.2.6 Audit log

Every remote-scoped request writes to a new `remote_audit_log` table (or extends `activity_log`): `{ timestamp, tokenPrefix, method, path, status, ip, userAgent }`. Retention: 7 days rolling, background cleanup via existing `startupCleanupService` pattern.

#### 4.2.7 Bind address

When remote mode is off: bind to `127.0.0.1` only (tighten current `localhost` default). When remote mode is on with `lan-only`: bind to `0.0.0.0`. With a tunnel provider: still `127.0.0.1`; tunnel handles exposure. This prevents accidental LAN exposure during tunnel mode.

### 4.3 Client changes

#### 4.3.1 Settings page

New `Settings → Remote Access` route:

- Status card: off / starting / active / error.
- Provider picker + install hints.
- "Start" / "Stop" buttons.
- On active: public URL, copy button, QR (qrcode.react or similar), token (one-time reveal, copy button, warning "we cannot show this again").
- Session history table.

#### 4.3.2 Token-aware API client

Existing client assumes same-origin + cookies-ish local auth. Refactor the fetch wrapper to:

1. Read token from `localStorage` key `atlas.apiToken` if present.
2. Attach `Authorization: Bearer ${token}` when set.
3. On 401 from a remote origin, show a "Paste your remote access token" modal.

First-run on a remote device: show the token paste screen before routing anywhere.

#### 4.3.3 Remote-awareness

Minor UI tells for the operator:

- Status bar badge: "Remote session active — <hostname>".
- Destructive actions (delete project, wipe data) require re-typing the token on remote origin. Local origin keeps current UX.

### 4.4 Security model

- **Default deny.** Feature is off. Enabling requires a local click.
- **Loopback-only control plane.** `/remote/start` and `/remote/stop` reject non-loopback callers even with a valid remote token. The tunnel cannot turn itself on.
- **Token hygiene.** 32-byte random, base64url. Stored as SHA-256 hash in `api_keys.keyHash` (existing pattern). Shown once. Prefix (first 8 chars) stored for UI listing.
- **TLS.** `cloudflared` and `ngrok` terminate TLS for us. `lan-only` and `custom` modes emit a warning if the resulting URL is `http://`.
- **CSRF.** Since auth is Bearer (not cookie), CSRF risk is low. Keep CORS restricted to the known public URL when a session is active.
- **Content-Security-Policy.** Tighten to prevent third-party script inclusion when remote session is active.
- **Scope enforcement.** Remote tokens cannot create new API keys, cannot change remote settings, cannot start/stop tunnels. Enforced at controller level via scope check helper.
- **Rate limit + lockout.** 5 failed auth attempts in 60s from the same IP → 15min block. Logged to audit table.
- **Kill switch.** Env var `ATLAS_REMOTE_DISABLED=true` hard-disables all remote endpoints regardless of DB state. For operators who want to forbid the feature org-wide.

### 4.5 Error surfaces

- CLI not installed → actionable error with install command per platform.
- Child exits before URL parsed → mark `error`, surface last 20 lines of stderr.
- Tunnel URL 5xx → show in status card, offer restart.
- Token lost → must stop and restart session (by design, no recovery).

### 4.6 Lifecycle edges

- Atlas server shutdown must stop the tunnel child. Integrate into existing `gracefulShutdown` in [packages/server/src/index.ts](packages/server/src/index.ts): after heartbeat stop, before http close, call `remoteAccessService.stopAll()`.
- Server restart with an active session row → on startup, mark `active` sessions as `stopped` with `lastError: 'server restart'` (mirror `startupCleanupService` pattern).
- User toggles remote off while a device is connected → that device's next request gets 401. Client shows "session ended by host".

## 5. Phase 2 — Atlas Cloud relay (forward-compatible design notes)

Not implemented now. These notes exist so Phase 1 doesn't paint us into a corner.

### 5.1 Shape

- `relay.atlas.app` accepts outbound websocket from a local Atlas instance (`cloud` provider adapter).
- Local instance registers with a user account (Atlas Cloud accounts — separate concern, uses OAuth).
- Public URL: `https://atlas.app/s/<slug>` → relay → ws → local instance → Hono app.
- Relay is stateless — does not see decrypted bodies if we layer end-to-end (stretch goal; can start with TLS termination at relay).

### 5.2 What Phase 1 must preserve

- `RemoteTransport` interface already abstract enough to add a `cloud` adapter whose `spawn()` is "open ws to relay.atlas.app".
- `api_keys.scope` already includes `'cloud'`.
- Auth middleware already distinguishes origin. Relay-origin requests carry an `X-Atlas-Relay: 1` header we can trust (signed by relay → verify signature with relay public key baked in).
- `remote_sessions.provider = 'cloud'` is just another enum value.
- Client token paste flow identical — token still lives in `localStorage`, attached as Bearer.

### 5.3 Revenue / licensing seam

- Cloud relay can be a paid service; the OSS project keeps tunnel mode free forever.
- Relay client in the OSS repo is fine — it just needs credentials. Server side (the relay itself) can live in a private repo.
- Make it clear in README: "Atlas is fully usable offline; Atlas Cloud is an optional convenience."

## 6. Implementation order

Cursor should produce a step-by-step plan covering these milestones. Each milestone should ship independently (PR-sized).

1. **Schema + scoped keys.** Migration adds `scope`, `expiresAt`, `revokedAt` to `api_keys`; new `remote_sessions` table; backfill existing keys as `scope = 'local'`.
2. **Auth middleware origin awareness.** Loopback detection, scope enforcement, rate limit. Unit tests.
3. **`RemoteTransport` interface + `lan` and `custom` providers.** Simplest adapters, no child process. Ship working LAN mode first.
4. **`cloudflared` provider.** Child process lifecycle, URL parsing, graceful shutdown integration.
5. **`ngrok` provider.** Same pattern. Optional, behind a feature check.
6. **`/api/v1/remote/*` routes + controllers + service.** Follows existing server conventions (`CLAUDE.md`).
7. **Audit log table + retention.**
8. **Client settings UI.** Settings → Remote Access page, start/stop, QR, token reveal.
9. **Client token-aware fetch wrapper.** Modal for paste flow on 401 from remote origin.
10. **Docs.** `docs/remote-access.md` user guide. README callout. Security considerations.
11. **QA.** Manual test matrix across providers, platforms (macOS/Linux/Windows), browsers.

## 7. Testing

- Unit: auth middleware (scope matrix), rate limiter, each provider's `parseUrl`.
- Integration: start/stop lifecycle against a mocked child process. Shutdown ordering test.
- Manual: each real provider at least once per release. Dogfood remotely from a phone.

## 8. Documentation deliverables

- `docs/remote-access.md` — user guide.
- `docs/remote-access-security.md` — threat model, what remote mode does and does not protect against.
- README — one-paragraph feature mention linking to the above.
- CHANGELOG entry.

## 9. Open questions for implementer to flag in plan

- Do we want a "read-only remote" scope for viewing without triggering agent runs? Useful for demoing.
- Should the token be per-device (one token → one connected client) or shared (one token → many devices)? Lean per-device for revocation granularity.
- Push notifications / webhooks from remote sessions (e.g. "your agent finished") — out of scope here but worth a placeholder.
- Do we care about IPv6-only networks in Phase 1? (Answer: yes, don't hardcode IPv4.)
