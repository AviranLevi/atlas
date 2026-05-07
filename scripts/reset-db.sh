#!/usr/bin/env bash
# reset-db.sh — Wipe all user data from the Atlas DB for a fresh start.
# Usage: bash scripts/reset-db.sh [--keep-agents]
#
# By default deletes EVERYTHING (projects, tasks, agents, etc.).
# Pass --keep-agents to preserve agents, providers, skills, and rules.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_PATH="$SCRIPT_DIR/../data/agents.db"

if [[ ! -f "$DB_PATH" ]]; then
  echo "❌ Database not found at $DB_PATH"
  exit 1
fi

KEEP_AGENTS=false
for arg in "$@"; do
  case "$arg" in
    --keep-agents) KEEP_AGENTS=true ;;
    -h|--help)
      echo "Usage: bash scripts/reset-db.sh [--keep-agents]"
      echo "  --keep-agents  Keep agents, providers, skills, rules, and MCP servers"
      exit 0
      ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

echo "🗑  Wiping Atlas database..."

# Order matters — children before parents (FK constraints).
sqlite3 "$DB_PATH" <<'SQL'
PRAGMA foreign_keys = OFF;

-- Workspace / pipeline data
DELETE FROM reviews;
DELETE FROM workspaces;
DELETE FROM pipeline_tasks;
DELETE FROM pipelines;

-- Task / project data
DELETE FROM phases;
DELETE FROM activity_log;
DELETE FROM usage_logs;
DELETE FROM project_docs;
DELETE FROM tasks;
DELETE FROM chat_messages;
DELETE FROM chat_conversations;
DELETE FROM heartbeat_runs;
DELETE FROM preferences;
DELETE FROM memory;
DELETE FROM resources;

-- Project-agent links (always cleared — recreated on reassign)
DELETE FROM agent_projects;

-- Projects themselves
DELETE FROM projects;

-- API keys (so browser bootstrap can re-issue a fresh key)
DELETE FROM api_keys;

PRAGMA foreign_keys = ON;
SQL

echo "   ⚠  API keys cleared — reload browser to re-bootstrap."

if [[ "$KEEP_AGENTS" == false ]]; then
  sqlite3 "$DB_PATH" <<'SQL'
PRAGMA foreign_keys = OFF;
DELETE FROM dispatch_rules;
DELETE FROM heartbeat_configs;
DELETE FROM integrations;
DELETE FROM agent_resources;
DELETE FROM agent_skills;
DELETE FROM skill_resources;
DELETE FROM agents;
DELETE FROM agent_providers;
DELETE FROM skills;
DELETE FROM global_instructions;
DELETE FROM mcp_servers;
PRAGMA foreign_keys = ON;
SQL
  echo "✅ All data wiped — full clean slate."
else
  echo "✅ Project data wiped. Agents, skills, and rules preserved."
fi

echo "   DB: $DB_PATH"
