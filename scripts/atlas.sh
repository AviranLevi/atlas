#!/usr/bin/env bash
# Atlas CLI utility — installed to ~/.local/bin/atlas
# Usage: atlas <command> [args]
set -euo pipefail

ATLAS_HOME="${ATLAS_HOME:-$HOME/.atlas}"
ATLAS_PORT="${ATLAS_PORT:-3100}"
FNM_DIR="${FNM_DIR:-$HOME/.local/share/fnm}"
PID_FILE="$ATLAS_HOME/atlas.pid"
LOG_DIR="$ATLAS_HOME/logs"

# ── Colours ───────────────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
  BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
else
  BOLD=''; GREEN=''; YELLOW=''; BLUE=''; RED=''; NC=''
fi

log()  { echo -e "${BLUE}▶${NC}  $*"; }
ok()   { echo -e "${GREEN}✔${NC}  $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
die()  { echo -e "${RED}✖${NC}  $*" >&2; exit 1; }

confirm() {
  local reply
  read -r -p "$(echo -e "   ${YELLOW}?${NC}  $1 [y/N] ")" reply < /dev/tty
  [[ "${reply:-N}" =~ ^[Yy]$ ]]
}

# ── Node env (fnm) ────────────────────────────────────────────────────────────
setup_node_env() {
  export PATH="$FNM_DIR:$PATH"
  if command -v fnm &>/dev/null; then
    eval "$(fnm env --shell bash 2>/dev/null)" || true
    fnm use 24 --silent 2>/dev/null || true
  fi
}

# ── PID helpers ───────────────────────────────────────────────────────────────
is_running() {
  [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

get_pid() {
  [[ -f "$PID_FILE" ]] && cat "$PID_FILE" || echo ""
}

write_pid() { echo "$1" > "$PID_FILE"; }
clear_pid() { rm -f "$PID_FILE"; }

# ── Commands ──────────────────────────────────────────────────────────────────

cmd_start() {
  if is_running; then
    ok "Atlas already running (pid $(get_pid)) → http://localhost:$ATLAS_PORT"
    return
  fi

  [[ -d "$ATLAS_HOME" ]] || die "Atlas not installed at $ATLAS_HOME. Run the installer first."
  [[ -f "$ATLAS_HOME/packages/server/dist/index.js" ]] \
    || die "Server not built. Run: atlas update"

  setup_node_env
  mkdir -p "$LOG_DIR"

  log "Starting Atlas on port $ATLAS_PORT..."
  cd "$ATLAS_HOME"
  NODE_ENV=production PORT="$ATLAS_PORT" \
    nohup node packages/server/dist/index.js \
      >> "$LOG_DIR/stdout.log" 2>> "$LOG_DIR/stderr.log" &

  local pid=$!
  write_pid "$pid"
  sleep 1

  if is_running; then
    ok "Atlas started (pid $pid) → http://localhost:$ATLAS_PORT"
  else
    clear_pid
    die "Atlas failed to start. Check logs: atlas logs"
  fi
}

cmd_stop() {
  if ! is_running; then
    warn "Atlas is not running."
    clear_pid
    return
  fi
  local pid
  pid="$(get_pid)"
  log "Stopping Atlas (pid $pid)..."
  kill -TERM "$pid" 2>/dev/null || true
  # Wait up to 5s for clean exit
  local i=0
  while kill -0 "$pid" 2>/dev/null && [[ $i -lt 10 ]]; do
    sleep 0.5; ((i++))
  done
  kill -KILL "$pid" 2>/dev/null || true
  clear_pid
  ok "Atlas stopped"
}

cmd_restart() {
  cmd_stop 2>/dev/null || true
  cmd_start
}

cmd_status() {
  echo ""
  if is_running; then
    local pid
    pid="$(get_pid)"
    echo -e "  ${GREEN}${BOLD}● Running${NC}   pid $pid"
    echo -e "  ${BOLD}URL:${NC}        http://localhost:$ATLAS_PORT"
    echo -e "  ${BOLD}Home:${NC}       $ATLAS_HOME"
    local node_ver
    setup_node_env
    node_ver="$(node --version 2>/dev/null || echo 'unknown')"
    echo -e "  ${BOLD}Node:${NC}       $node_ver"
    echo -e "  ${BOLD}Logs:${NC}       $LOG_DIR"
    echo ""
    # Check if port is actually responding
    if curl -sf --max-time 2 "http://localhost:$ATLAS_PORT/api/v1/health" &>/dev/null; then
      echo -e "  ${GREEN}✔${NC}  HTTP OK"
    else
      echo -e "  ${YELLOW}⚠${NC}  Process running but HTTP not responding yet"
    fi
  else
    echo -e "  ${RED}○ Stopped${NC}"
  fi
  echo ""
}

cmd_update() {
  log "Fetching latest changes..."
  git -C "$ATLAS_HOME" fetch origin --quiet

  local local_sha remote_sha
  local_sha="$(git -C "$ATLAS_HOME" rev-parse HEAD)"
  remote_sha="$(git -C "$ATLAS_HOME" rev-parse 'origin/main')"

  if [[ "$local_sha" == "$remote_sha" ]]; then
    ok "Already up to date."
    return
  fi

  local was_running=false
  if is_running; then
    was_running=true
    log "Stopping Atlas for update..."
    cmd_stop
  fi

  log "Applying updates..."
  git -C "$ATLAS_HOME" reset --hard "origin/main" --quiet

  log "Installing dependencies..."
  cd "$ATLAS_HOME"
  setup_node_env
  pnpm install --frozen-lockfile --silent

  log "Rebuilding..."
  pnpm build --silent
  ok "Build complete"

  if $was_running; then
    cmd_start
  else
    ok "Update complete. Run 'atlas start' to start."
  fi
}

cmd_logs() {
  local lines="${1:-50}"
  mkdir -p "$LOG_DIR"
  touch "$LOG_DIR/stdout.log" "$LOG_DIR/stderr.log"

  # Merge both streams with label prefix for clarity
  echo -e "${BOLD}Tailing Atlas logs (Ctrl+C to stop)${NC}"
  echo "──────────────────────────────────"
  tail -n "$lines" -f \
    "$LOG_DIR/stdout.log" \
    "$LOG_DIR/stderr.log"
}

cmd_open() {
  local url="http://localhost:$ATLAS_PORT"
  if [[ "$(uname -s)" == "Darwin" ]]; then
    open "$url"
  else
    xdg-open "$url" 2>/dev/null || echo "Open: $url"
  fi
}

cmd_service_install() {
  local os
  os="$(uname -s)"
  if [[ "$os" == "Darwin" ]]; then
    _install_launchagent
  elif [[ "$os" == "Linux" ]]; then
    _install_systemd
  else
    die "Service management not supported on $os"
  fi
}

cmd_service_uninstall() {
  local os
  os="$(uname -s)"
  if [[ "$os" == "Darwin" ]]; then
    local plist="$HOME/Library/LaunchAgents/com.atlas.server.plist"
    launchctl unload "$plist" 2>/dev/null || true
    rm -f "$plist"
    ok "LaunchAgent removed — Atlas will no longer start on login"
  elif [[ "$os" == "Linux" ]]; then
    systemctl --user disable --now atlas 2>/dev/null || true
    rm -f "$HOME/.config/systemd/user/atlas.service"
    systemctl --user daemon-reload 2>/dev/null || true
    ok "systemd service removed"
  fi
}

cmd_service_status() {
  local os
  os="$(uname -s)"
  if [[ "$os" == "Darwin" ]]; then
    launchctl list com.atlas.server 2>/dev/null \
      && ok "LaunchAgent is loaded" \
      || warn "LaunchAgent not installed"
  elif [[ "$os" == "Linux" ]]; then
    systemctl --user status atlas 2>/dev/null || warn "systemd service not installed"
  fi
}

cmd_uninstall() {
  echo ""
  warn "This will remove Atlas completely."
  warn "Home:    $ATLAS_HOME"
  warn "CLI:     $HOME/.local/bin/atlas"
  warn "Service: LaunchAgent / systemd unit"
  echo ""
  confirm "Continue with uninstall?" || { log "Aborted."; exit 0; }

  cmd_stop 2>/dev/null || true
  cmd_service_uninstall 2>/dev/null || true

  rm -f "$HOME/.local/bin/atlas"
  rm -rf "$ATLAS_HOME"
  ok "Atlas uninstalled. Database and logs removed."
}

# ── Internal: daemon entry (called by service managers) ──────────────────────
# Not intended for direct use — service plist/unit calls this.
_start_daemon() {
  setup_node_env
  mkdir -p "$LOG_DIR"
  cd "$ATLAS_HOME"
  NODE_ENV=production PORT="$ATLAS_PORT" exec node packages/server/dist/index.js
}

# ── Service file helpers ──────────────────────────────────────────────────────
_install_launchagent() {
  local plist_dir="$HOME/Library/LaunchAgents"
  local plist_file="$plist_dir/com.atlas.server.plist"

  mkdir -p "$plist_dir" "$LOG_DIR"
  cat > "$plist_file" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.atlas.server</string>
  <key>ProgramArguments</key>
  <array>
    <string>$HOME/.local/bin/atlas</string>
    <string>_start-daemon</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key>
  <dict><key>SuccessfulExit</key><false/></dict>
  <key>StandardOutPath</key><string>$LOG_DIR/stdout.log</string>
  <key>StandardErrorPath</key><string>$LOG_DIR/stderr.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>ATLAS_HOME</key><string>$ATLAS_HOME</string>
    <key>ATLAS_PORT</key><string>$ATLAS_PORT</string>
    <key>FNM_DIR</key><string>$FNM_DIR</string>
    <key>PATH</key><string>$FNM_DIR:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
PLIST

  launchctl unload "$plist_file" 2>/dev/null || true
  launchctl load -w "$plist_file"
  ok "LaunchAgent installed — Atlas starts on login"
}

_install_systemd() {
  local svc_dir="$HOME/.config/systemd/user"
  local svc_file="$svc_dir/atlas.service"

  mkdir -p "$svc_dir" "$LOG_DIR"
  cat > "$svc_file" <<UNIT
[Unit]
Description=Atlas AI Agent Dashboard
After=network.target

[Service]
Type=simple
ExecStart=$HOME/.local/bin/atlas _start-daemon
Restart=on-failure
RestartSec=5s
Environment=ATLAS_HOME=$ATLAS_HOME
Environment=ATLAS_PORT=$ATLAS_PORT
Environment=FNM_DIR=$FNM_DIR
Environment=PATH=$FNM_DIR:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin
StandardOutput=append:$LOG_DIR/stdout.log
StandardError=append:$LOG_DIR/stderr.log

[Install]
WantedBy=default.target
UNIT

  systemctl --user daemon-reload
  systemctl --user enable --now atlas
  ok "systemd service installed and started"
  ok "Enabled for user login (loginctl enable-linger may be needed for boot-time start)"
}

# ── Help ──────────────────────────────────────────────────────────────────────
print_help() {
  echo -e "
${BOLD}Atlas CLI${NC}  — AI Agent Dashboard

${BOLD}Usage:${NC}  atlas <command>

${BOLD}Commands:${NC}
  ${GREEN}start${NC}                   Start the Atlas server
  ${GREEN}stop${NC}                    Stop the Atlas server
  ${GREEN}restart${NC}                 Restart the Atlas server
  ${GREEN}status${NC}                  Show running state, PID, port
  ${GREEN}logs [lines]${NC}            Tail logs (default: last 50 lines)
  ${GREEN}open${NC}                    Open Atlas in the browser
  ${GREEN}update${NC}                  Pull latest changes and rebuild
  ${GREEN}service install${NC}         Install as startup service (launchd / systemd)
  ${GREEN}service uninstall${NC}       Remove startup service
  ${GREEN}service status${NC}          Show service state
  ${GREEN}uninstall${NC}               Remove Atlas completely

${BOLD}Environment:${NC}
  ATLAS_HOME    Install location  (default: ~/.atlas)
  ATLAS_PORT    Server port       (default: 3100)
"
}

# ── Dispatch ──────────────────────────────────────────────────────────────────
case "${1:-help}" in
  start)            cmd_start ;;
  stop)             cmd_stop ;;
  restart)          cmd_restart ;;
  status)           cmd_status ;;
  update)           cmd_update ;;
  logs)             cmd_logs "${2:-50}" ;;
  open)             cmd_open ;;
  service)
    case "${2:-help}" in
      install)      cmd_service_install ;;
      uninstall)    cmd_service_uninstall ;;
      status)       cmd_service_status ;;
      *)            echo "Usage: atlas service <install|uninstall|status>"; exit 1 ;;
    esac ;;
  uninstall)        cmd_uninstall ;;
  _start-daemon)    _start_daemon ;;   # called by launchd/systemd — not for direct use
  help|--help|-h)   print_help ;;
  *)                echo "Unknown command: $1. Run 'atlas help'." >&2; exit 1 ;;
esac
