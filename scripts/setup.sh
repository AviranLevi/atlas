#!/usr/bin/env bash
# Atlas — dev setup script
# Installs fnm + Node 24 + pnpm, then installs deps and builds.
# Usage: bash scripts/setup.sh
#    or: pnpm setup  (if pnpm is already available)
set -euo pipefail

NODE_VERSION="24"
FNM_DIR="${FNM_DIR:-$HOME/.local/share/fnm}"

# ── Colours ──────────────────────────────────────────────────────────────────
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

# ── Resolve project root (where this script lives is scripts/) ───────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "\n${BOLD}  Atlas — Dev Setup${NC}\n"

# ── 1. fnm ───────────────────────────────────────────────────────────────────
log "Checking fnm (Fast Node Manager)..."

if command -v fnm &>/dev/null || [[ -x "$FNM_DIR/fnm" ]]; then
  export PATH="$FNM_DIR:$PATH"
  ok "fnm already installed"
else
  log "Installing fnm..."
  curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell --install-dir "$FNM_DIR"
  export PATH="$FNM_DIR:$PATH"
  ok "fnm installed to $FNM_DIR"

  # Add fnm to shell rc files for future sessions
  local_init='export PATH="'"$FNM_DIR"':$PATH"; eval "$(fnm env)"'
  for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
    if [[ -f "$rc" ]] && ! grep -q "fnm env" "$rc" 2>/dev/null; then
      echo -e "\n# Atlas / fnm\n$local_init" >> "$rc"
      ok "Added fnm init to $(basename "$rc")"
    fi
  done
fi

# ── 2. Node.js (pin to exact major from .nvmrc) ─────────────────────────────
log "Setting up Node.js $NODE_VERSION..."
eval "$(fnm env --shell bash 2>/dev/null)" || true

current_major="$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1 || echo 0)"

if [[ "$current_major" -eq "$NODE_VERSION" ]]; then
  ok "Node $(node --version) already active"
else
  if [[ "$current_major" -gt "$NODE_VERSION" ]]; then
    warn "Node v$current_major detected — Atlas requires exactly Node $NODE_VERSION (native modules like better-sqlite3 may not compile on newer versions)"
  fi
  log "Installing Node.js $NODE_VERSION via fnm..."
  fnm install "$NODE_VERSION"
  fnm use "$NODE_VERSION"
  fnm default "$NODE_VERSION"
  eval "$(fnm env --shell bash 2>/dev/null)" || true
  ok "Node $(node --version) installed and set as default"
fi

# ── 3. pnpm ──────────────────────────────────────────────────────────────────
log "Checking pnpm..."

if command -v pnpm &>/dev/null; then
  ok "pnpm $(pnpm --version) already installed"
else
  log "Installing pnpm..."
  if command -v corepack &>/dev/null; then
    corepack enable pnpm 2>/dev/null || true
    corepack prepare pnpm@latest --activate 2>/dev/null || npm install -g pnpm
  else
    npm install -g pnpm
  fi
  ok "pnpm $(pnpm --version) installed"
fi

# ── 4. Dependencies ──────────────────────────────────────────────────────────
log "Installing dependencies..."
cd "$PROJECT_ROOT"
pnpm install

# Rebuild native modules for the active Node version
log "Rebuilding native modules for Node $(node --version)..."
pnpm rebuild better-sqlite3 2>/dev/null || true
ok "Dependencies installed"

# ── 5. Server .env.development ───────────────────────────────────────────────
ENV_FILE="$PROJECT_ROOT/packages/server/.env.development"
if [[ ! -f "$ENV_FILE" ]]; then
  log "Creating server .env.development..."
  cat > "$ENV_FILE" <<EOF
NODE_ENV=development
PORT=3100
ATLAS_AUTH_BYPASS=true
EOF
  ok "Created $ENV_FILE"
else
  ok ".env.development already exists"
fi

# ── 6. Build ─────────────────────────────────────────────────────────────────
log "Building project..."
pnpm build
ok "Build complete"

# ── Done ─────────────────────────────────────────────────────────────────────
echo -e "
${GREEN}${BOLD}  ✔ Setup complete!${NC}

  Run the dev server:  ${BOLD}pnpm dev${NC}
  Build for prod:      ${BOLD}pnpm build${NC}
  Run tests:           ${BOLD}pnpm test${NC}
"
