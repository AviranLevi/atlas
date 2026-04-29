#!/usr/bin/env bash
# Atlas — one-liner installer
# Usage: curl -fsSL https://raw.githubusercontent.com/AviranLevi/atlas/main/install.sh | bash
# Or:    ATLAS_HOME=/custom/path bash install.sh
set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
ATLAS_HOME="${ATLAS_HOME:-$HOME/.atlas}"
ATLAS_PORT="${ATLAS_PORT:-3100}"
REPO_URL="${ATLAS_REPO:-https://github.com/AviranLevi/atlas.git}"
REPO_BRANCH="${ATLAS_BRANCH:-main}"
NODE_VERSION="24"
FNM_DIR="${FNM_DIR:-$HOME/.local/share/fnm}"

# ── Colours ──────────────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
  BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
else
  BOLD=''; GREEN=''; YELLOW=''; BLUE=''; RED=''; NC=''
fi

log()     { echo -e "${BLUE}▶${NC}  $*"; }
ok()      { echo -e "${GREEN}✔${NC}  $*"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $*"; }
die()     { echo -e "${RED}✖${NC}  $*" >&2; exit 1; }
heading() { echo -e "\n${BOLD}$*${NC}"; }

confirm() {
  local prompt="${1:-Continue?} [Y/n] "
  local reply
  read -r -p "$(echo -e "   ${YELLOW}?${NC}  $prompt")" reply < /dev/tty
  [[ "${reply:-Y}" =~ ^[Yy]$ ]]
}

# ── OS detection ─────────────────────────────────────────────────────────────
detect_os() {
  OS="$(uname -s)"
  ARCH="$(uname -m)"
  case "$OS" in
    Darwin) OS="macos" ;;
    Linux)  OS="linux" ;;
    *)      die "Unsupported OS: $OS. Atlas supports macOS and Linux." ;;
  esac
  case "$ARCH" in
    x86_64|amd64) ARCH="x64"   ;;
    arm64|aarch64) ARCH="arm64" ;;
    *) warn "Unknown arch: $ARCH — proceeding anyway." ;;
  esac
  ok "Detected $OS / $ARCH"
}

# ── fnm (Fast Node Manager) ──────────────────────────────────────────────────
ensure_fnm() {
  if command -v fnm &>/dev/null || [[ -x "$FNM_DIR/fnm" ]]; then
    export PATH="$FNM_DIR:$PATH"
    ok "fnm already installed"
    return
  fi

  log "Installing fnm (Fast Node Manager)..."
  curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell --install-dir "$FNM_DIR"
  export PATH="$FNM_DIR:$PATH"
  ok "fnm installed to $FNM_DIR"

  # Add fnm to common shell rc files for future interactive sessions
  local init_cmd='export PATH="'"$FNM_DIR"':$PATH"; eval "$(fnm env --shell bash)"'
  for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
    if [[ -f "$rc" ]] && ! grep -q "fnm env" "$rc" 2>/dev/null; then
      echo -e "\n# Atlas / fnm\n$init_cmd" >> "$rc"
      ok "Added fnm init to $rc"
    fi
  done
}

# ── Node.js 24 ───────────────────────────────────────────────────────────────
ensure_node() {
  eval "$(fnm env --shell bash)"

  local current_major
  current_major="$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1 || echo 0)"

  if [[ "$current_major" -ge "$NODE_VERSION" ]]; then
    ok "Node $(node --version) already active"
    return
  fi

  log "Installing Node.js $NODE_VERSION via fnm..."
  fnm install "$NODE_VERSION" --silent
  fnm use "$NODE_VERSION"
  fnm default "$NODE_VERSION"
  ok "Node $(node --version) installed and set as default"
}

# ── pnpm ─────────────────────────────────────────────────────────────────────
ensure_pnpm() {
  if command -v pnpm &>/dev/null; then
    ok "pnpm $(pnpm --version) already installed"
    return
  fi

  log "Installing pnpm..."
  # Corepack ships with Node 16+. Enable and prepare pnpm.
  if command -v corepack &>/dev/null; then
    corepack enable pnpm 2>/dev/null || true
    corepack prepare pnpm@latest --activate 2>/dev/null || npm install -g pnpm --silent
  else
    npm install -g pnpm --silent
  fi
  ok "pnpm $(pnpm --version) installed"
}

# ── Repo ─────────────────────────────────────────────────────────────────────
clone_or_update() {
  if [[ -d "$ATLAS_HOME/.git" ]]; then
    log "Updating existing installation at $ATLAS_HOME..."
    git -C "$ATLAS_HOME" fetch origin "$REPO_BRANCH" --quiet
    git -C "$ATLAS_HOME" reset --hard "origin/$REPO_BRANCH" --quiet
    ok "Updated to latest $REPO_BRANCH"
  else
    log "Cloning Atlas to $ATLAS_HOME..."
    mkdir -p "$(dirname "$ATLAS_HOME")"
    git clone --depth 1 --branch "$REPO_BRANCH" "$REPO_URL" "$ATLAS_HOME" --quiet
    ok "Cloned to $ATLAS_HOME"
  fi
}

# ── Build ────────────────────────────────────────────────────────────────────
build_atlas() {
  cd "$ATLAS_HOME"

  log "Installing dependencies..."
  pnpm install --frozen-lockfile --silent

  log "Building Atlas (shared → server → client)..."
  pnpm build --silent
  ok "Build complete"
}

# ── Atlas CLI symlink ────────────────────────────────────────────────────────
install_cli() {
  local bin_dir="$HOME/.local/bin"
  local cli_src="$ATLAS_HOME/scripts/atlas.sh"
  local cli_link="$bin_dir/atlas"

  mkdir -p "$bin_dir"
  chmod +x "$cli_src"
  ln -sf "$cli_src" "$cli_link"

  # Add ~/.local/bin to PATH if not already there
  if ! echo "$PATH" | grep -q "$bin_dir"; then
    export PATH="$bin_dir:$PATH"
    for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
      if [[ -f "$rc" ]] && ! grep -q '\.local/bin' "$rc" 2>/dev/null; then
        echo -e '\nexport PATH="$HOME/.local/bin:$PATH"' >> "$rc"
      fi
    done
  fi

  ok "atlas CLI installed → $cli_link"
}

# ── OS Service ───────────────────────────────────────────────────────────────
install_service() {
  if [[ "$OS" == "macos" ]]; then
    install_launchagent
  else
    install_systemd
  fi
}

install_launchagent() {
  local plist_dir="$HOME/Library/LaunchAgents"
  local plist_file="$plist_dir/com.atlas.server.plist"
  local log_dir="$ATLAS_HOME/logs"

  mkdir -p "$plist_dir" "$log_dir"

  cat > "$plist_file" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.atlas.server</string>

  <key>ProgramArguments</key>
  <array>
    <string>$HOME/.local/bin/atlas</string>
    <string>_start-daemon</string>
  </array>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <dict>
    <key>SuccessfulExit</key>
    <false/>
  </dict>

  <key>StandardOutPath</key>
  <string>$log_dir/stdout.log</string>

  <key>StandardErrorPath</key>
  <string>$log_dir/stderr.log</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>ATLAS_HOME</key>
    <string>$ATLAS_HOME</string>
    <key>ATLAS_PORT</key>
    <string>$ATLAS_PORT</string>
    <key>PATH</key>
    <string>$FNM_DIR:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
PLIST

  # Unload first if already loaded (idempotent)
  launchctl unload "$plist_file" 2>/dev/null || true
  launchctl load -w "$plist_file"
  ok "LaunchAgent installed — Atlas will start on login"
}

install_systemd() {
  local service_dir="$HOME/.config/systemd/user"
  local service_file="$service_dir/atlas.service"
  local log_dir="$ATLAS_HOME/logs"

  mkdir -p "$service_dir" "$log_dir"

  cat > "$service_file" <<UNIT
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
Environment=PATH=$FNM_DIR:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin
StandardOutput=append:$log_dir/stdout.log
StandardError=append:$log_dir/stderr.log

[Install]
WantedBy=default.target
UNIT

  systemctl --user daemon-reload
  systemctl --user enable --now atlas
  ok "systemd user service installed and started"
}

# ── Start ────────────────────────────────────────────────────────────────────
start_atlas() {
  if [[ -f "$ATLAS_HOME/atlas.pid" ]]; then
    local pid
    pid="$(cat "$ATLAS_HOME/atlas.pid")"
    if kill -0 "$pid" 2>/dev/null; then
      ok "Atlas already running (pid $pid)"
      return
    fi
  fi

  log "Starting Atlas..."
  "$HOME/.local/bin/atlas" start
}

open_browser() {
  local url="http://localhost:$ATLAS_PORT"
  sleep 2  # brief wait for server to bind
  if [[ "$OS" == "macos" ]]; then
    open "$url" 2>/dev/null || true
  else
    xdg-open "$url" 2>/dev/null || true
  fi
}

# ── Banner ───────────────────────────────────────────────────────────────────
print_banner() {
  echo -e "
${BOLD}  ╔═══════════════════════════════╗
  ║   Atlas — AI Agent Dashboard  ║
  ╚═══════════════════════════════╝${NC}
  https://github.com/AviranLevi/atlas
"
}

print_success() {
  echo -e "
${GREEN}${BOLD}  ✔ Atlas installed successfully!${NC}

  ${BOLD}Open:${NC}   http://localhost:$ATLAS_PORT
  ${BOLD}Logs:${NC}   atlas logs
  ${BOLD}Update:${NC} atlas update
  ${BOLD}Stop:${NC}   atlas stop
"
}

# ── Main ─────────────────────────────────────────────────────────────────────
main() {
  print_banner

  echo -e "  Installing to: ${BOLD}$ATLAS_HOME${NC}"
  echo -e "  Port:          ${BOLD}$ATLAS_PORT${NC}\n"

  detect_os

  heading "1/5  Node.js $NODE_VERSION"
  ensure_fnm
  ensure_node

  heading "2/5  pnpm"
  ensure_pnpm

  heading "3/5  Repository"
  clone_or_update

  heading "4/5  Build"
  build_atlas

  heading "5/5  Finishing up"
  install_cli

  if confirm "Run Atlas automatically on login/boot?"; then
    install_service
  fi

  start_atlas

  print_success
  open_browser
}

main
