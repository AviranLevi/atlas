#!/usr/bin/env bash
# self-update.sh — Called by the server's POST /system/update endpoint.
# Runs as a detached process: waits for the old server to die, pulls the
# latest code, installs deps, builds, and restarts the server.
#
# Environment (inherited from the server):
#   ATLAS_HOME  — install location (default: ~/.atlas)
#   ATLAS_PORT  — server port     (default: 3100)
set -euo pipefail

ATLAS_HOME="${ATLAS_HOME:-$HOME/.atlas}"
ATLAS_PORT="${ATLAS_PORT:-3100}"
FNM_DIR="${FNM_DIR:-$HOME/.local/share/fnm}"
PROGRESS_FILE="$ATLAS_HOME/update-progress.json"
LOG_FILE="$ATLAS_HOME/logs/update.log"

mkdir -p "$(dirname "$LOG_FILE")"
exec >> "$LOG_FILE" 2>&1
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Self-update started at $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "═══════════════════════════════════════════════════════"

# ── Helpers ──────────────────────────────────────────────────────────────

write_progress() {
  local status="$1" step="${2:-}" current_step="${3:-0}" error="${4:-null}"
  cat > "$PROGRESS_FILE" <<EOJSON
{
  "status": "$status",
  "step": "$step",
  "steps": ["fetching", "installing", "building", "starting"],
  "currentStep": $current_step,
  "startedAt": "$START_TIME",
  "error": $error
}
EOJSON
}

setup_node_env() {
  export PATH="$FNM_DIR:$PATH"
  if command -v fnm &>/dev/null; then
    eval "$(fnm env --shell bash 2>/dev/null)" || true
    fnm use 24 --silent 2>/dev/null || true
  fi
}

START_TIME="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
PREV_SHA=""

# ── Trap: on failure, write error and try to restart old code ────────────

on_failure() {
  local err_msg="${1:-Unknown error during update}"
  echo "ERROR: $err_msg"
  write_progress "failed" "" 0 "\"$err_msg\""

  # Try to restore old code if we have a previous SHA
  if [[ -n "$PREV_SHA" ]]; then
    echo "Attempting rollback to $PREV_SHA..."
    git -C "$ATLAS_HOME" reset --hard "$PREV_SHA" 2>/dev/null || true
    cd "$ATLAS_HOME"
    setup_node_env
    pnpm install --frozen-lockfile --silent 2>/dev/null || true
    pnpm build --silent 2>/dev/null || true
  fi

  # Always try to restart the server
  echo "Restarting server with current code..."
  start_server
}

start_server() {
  cd "$ATLAS_HOME"
  setup_node_env
  if [[ -f "$ATLAS_HOME/packages/server/dist/index.js" ]]; then
    NODE_ENV=production PORT="$ATLAS_PORT" \
      nohup node packages/server/dist/index.js \
        >> "$ATLAS_HOME/logs/stdout.log" 2>> "$ATLAS_HOME/logs/stderr.log" &
    local pid=$!

    # Write PID file for atlas CLI
    echo "$pid" > "$ATLAS_HOME/atlas.pid" 2>/dev/null || true

    echo "Server started (pid $pid)"
  else
    echo "ERROR: Server dist not found, cannot restart"
  fi
}

# ── Wait for old server to exit ──────────────────────────────────────────

echo "Waiting for server to shut down..."
sleep 2

# If a PID file exists, wait for that process to die
PID_FILE="$ATLAS_HOME/atlas.pid"
if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE" 2>/dev/null || echo "")"
  if [[ -n "$OLD_PID" ]]; then
    local_wait=0
    while kill -0 "$OLD_PID" 2>/dev/null && [[ $local_wait -lt 20 ]]; do
      sleep 0.5
      ((local_wait++))
    done
    # Force kill if still alive
    kill -KILL "$OLD_PID" 2>/dev/null || true
  fi
fi

# ── Step 1: Fetch latest code ────────────────────────────────────────────

write_progress "updating" "fetching" 0
echo "Step 1/4: Fetching latest code..."

cd "$ATLAS_HOME"
PREV_SHA="$(git rev-parse HEAD 2>/dev/null || echo "")"

if ! git fetch origin --quiet 2>&1; then
  on_failure "Failed to fetch from origin"
  exit 1
fi

REMOTE_SHA="$(git rev-parse 'origin/main' 2>/dev/null || echo "")"
if [[ -z "$REMOTE_SHA" ]]; then
  on_failure "Could not resolve origin/main"
  exit 1
fi

if [[ "$PREV_SHA" == "$REMOTE_SHA" ]]; then
  echo "Already up to date ($PREV_SHA)"
  write_progress "completed" "starting" 4
  start_server
  exit 0
fi

if ! git reset --hard "origin/main" --quiet 2>&1; then
  on_failure "Failed to apply updates (git reset)"
  exit 1
fi

echo "Updated: $PREV_SHA → $REMOTE_SHA"

# ── Step 2: Install dependencies ─────────────────────────────────────────

write_progress "updating" "installing" 1
echo "Step 2/4: Installing dependencies..."

setup_node_env

if ! pnpm install --frozen-lockfile --silent 2>&1; then
  on_failure "pnpm install failed"
  exit 1
fi

# ── Step 3: Build ────────────────────────────────────────────────────────

write_progress "updating" "building" 2
echo "Step 3/4: Building..."

if ! pnpm build --silent 2>&1; then
  on_failure "pnpm build failed"
  exit 1
fi

echo "Build complete"

# ── Step 4: Start server ─────────────────────────────────────────────────

write_progress "updating" "starting" 3
echo "Step 4/4: Starting server..."

start_server

# Brief pause to let server boot
sleep 2

# Verify server is responding
if curl -sf --max-time 5 "http://localhost:$ATLAS_PORT/api/v1/system/info" &>/dev/null; then
  echo "Server is healthy"
  write_progress "completed" "starting" 4
else
  echo "Warning: server may still be starting up"
  write_progress "completed" "starting" 4
fi

echo "Update complete!"
