/**
 * Lockout escape hatch for the auto-bootstrap auth flow.
 *
 * Atlas only stores SHA-256 hashes of API keys, never the raw key. If a user
 * clears localStorage without backing up their key, every protected route
 * returns 401 and there is no in-app path to recover — the bootstrap endpoint
 * itself returns 409 because `api_keys` is non-empty.
 *
 * This script is the documented escape hatch: it deletes every row in
 * `api_keys` so the next browser load triggers a fresh bootstrap. Wired up
 * from the root as `pnpm atlas:reset-auth`.
 *
 * Safety:
 *   - Interactive `[y/N]` prompt by default. Anything other than `y`/`Y` aborts.
 *   - `--force` flag (or `ATLAS_RESET_AUTH_FORCE=1`) bypasses the prompt for
 *     scripted use (CI, dotfile installers, etc.).
 *   - Idempotent — running twice is harmless.
 *
 * Path resolution mirrors `packages/server/src/db/index.ts` so the script
 * always targets the same `data/agents.db` the running server uses.
 */
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPackageRoot = path.resolve(__dirname, '..');
const dbPath = path.resolve(serverPackageRoot, '../../data/agents.db');

const force = process.argv.includes('--force') || process.env.ATLAS_RESET_AUTH_FORCE === '1';

async function confirm(count: number): Promise<boolean> {
  if (force) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`This will delete ${count} API key(s) from ${dbPath}. Continue? [y/N] `);
    return answer.trim().toLowerCase() === 'y';
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  let db: Database.Database;
  try {
    db = new Database(dbPath, { fileMustExist: true });
  } catch (err) {
    console.error(`[reset-auth] Could not open ${dbPath}.`);
    console.error('[reset-auth] If the server has never run, there are no keys to reset — start Atlas first.');
    if (err instanceof Error) console.error(`[reset-auth] ${err.message}`);
    process.exit(1);
  }

  let count: number;
  try {
    const row = db.prepare('SELECT COUNT(*) AS n FROM api_keys').get() as { n: number };
    count = row.n;
  } catch (err) {
    console.error('[reset-auth] Could not read api_keys table — has the server initialized the DB at least once?');
    if (err instanceof Error) console.error(`[reset-auth] ${err.message}`);
    db.close();
    process.exit(1);
  }

  if (count === 0) {
    console.log('[reset-auth] No keys found. Nothing to do.');
    db.close();
    return;
  }

  const ok = await confirm(count);
  if (!ok) {
    console.log('[reset-auth] Aborted. No changes made.');
    db.close();
    return;
  }

  try {
    const result = db.prepare('DELETE FROM api_keys').run();
    console.log(`[reset-auth] Removed ${result.changes} key(s). Reload the browser to bootstrap a new one.`);
  } catch (err) {
    console.error('[reset-auth] Failed to delete keys.');
    if (err instanceof Error) console.error(`[reset-auth] ${err.message}`);
    process.exit(1);
  } finally {
    db.close();
  }
}

main().catch((err) => {
  console.error('[reset-auth] Unexpected error:', err);
  process.exit(1);
});
