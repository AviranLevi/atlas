#!/usr/bin/env bash
# seed-test-projects.sh
# Seeds Atlas with realistic demo data for README screenshots / GIFs.
#
# Creates 3 projects with different configs, agents, rules, skills, tasks,
# phases, memory entries, quick actions, global instructions, and dispatch rules
# so every page in the UI looks populated.
#
# Usage:
#   bash scripts/seed-test-projects.sh          # seed fresh data
#   bash scripts/seed-test-projects.sh --clean   # wipe DB + re-seed
#
# Auth: Auto-bootstraps an API key via the local-only /auth/bootstrap endpoint.
#        Falls back to bypass mode if ATLAS_AUTH_BYPASS=true is set.

set -euo pipefail

API="http://localhost:3100/api/v1"
TEST_DIR="$HOME/Documents/Projects/test-builds"
AUTH_HEADER=""

# ── Handle --clean flag ────────────────────────────────────────────────────

if [[ "${1:-}" == "--clean" ]]; then
  echo "→ Cleaning database..."
  DB_PATH="$(dirname "$0")/../data/agents.db"
  if [ -f "$DB_PATH" ]; then
    rm -f "$DB_PATH" "$DB_PATH-wal" "$DB_PATH-shm"
    echo "  ✓ Database removed. Restart the server before re-running."
    exit 0
  else
    echo "  ⚠ No database found at $DB_PATH"
    exit 0
  fi
fi

# ── Helpers ──────────────────────────────────────────────────────────────────

post() {
  local endpoint="$1" body="$2"
  curl -s -X POST "$API$endpoint" \
    -H "Content-Type: application/json" \
    ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
    -d "$body"
}

put() {
  local endpoint="$1" body="$2"
  curl -s -X PUT "$API$endpoint" \
    -H "Content-Type: application/json" \
    ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
    -d "$body"
}

get() {
  local endpoint="$1"
  curl -s "$API$endpoint" \
    ${AUTH_HEADER:+-H "$AUTH_HEADER"}
}

jq_id() { python3 -c "import sys,json; print(json.loads(sys.stdin.read())['id'])"; }

# Post a rule: post_rule <name> <type> <tags_json> <content> <projectId>
post_rule() {
  local name="$1" type="$2" tags="$3" content="$4" pid="$5"
  python3 -c "
import json, sys, urllib.request
body = json.dumps({'name': sys.argv[1], 'type': sys.argv[2], 'tags': json.loads(sys.argv[3]), 'content': sys.argv[4], 'projectId': sys.argv[5]})
req = urllib.request.Request(sys.argv[6], data=body.encode(), headers={'Content-Type': 'application/json'${AUTH_HEADER:+, 'Authorization': '${AUTH_HEADER#Authorization: }'}})
urllib.request.urlopen(req)
" "$name" "$type" "$tags" "$content" "$pid" "$API/rules"
}

# Post a skill: post_skill <name> <type> <steps> <inputFormat> <outputFormat> <projectId>
post_skill() {
  local name="$1" type="$2" steps="$3" input="$4" output="$5" pid="$6"
  python3 -c "
import json, sys, urllib.request
body = json.dumps({'name': sys.argv[1], 'type': sys.argv[2], 'steps': sys.argv[3], 'inputFormat': sys.argv[4], 'outputFormat': sys.argv[5], 'projectId': sys.argv[6]})
req = urllib.request.Request(sys.argv[7], data=body.encode(), headers={'Content-Type': 'application/json'${AUTH_HEADER:+, 'Authorization': '${AUTH_HEADER#Authorization: }'}})
urllib.request.urlopen(req)
" "$name" "$type" "$steps" "$input" "$output" "$pid" "$API/skills"
}

echo "╔══════════════════════════════════════════╗"
echo "║   Atlas Demo Data Seed Script            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Check server ─────────────────────────────────────────────────────────

echo "→ Checking server..."
if ! curl -s "$API/" > /dev/null 2>&1; then
  echo "✗ Server not reachable at $API. Start it first (pnpm dev)."
  exit 1
fi
echo "  ✓ Server is running"

# ── 2. Bootstrap auth key ──────────────────────────────────────────────────

echo ""
echo "→ Setting up authentication..."
BOOTSTRAP_RESP=$(curl -s -X POST "$API/auth/bootstrap" -H "Content-Type: application/json")
RAW_KEY=$(echo "$BOOTSTRAP_RESP" | python3 -c "import sys,json; print(json.loads(sys.stdin.read()).get('rawKey',''))" 2>/dev/null || echo "")

if [ -n "$RAW_KEY" ]; then
  AUTH_HEADER="Authorization: Bearer $RAW_KEY"
  echo "  ✓ API key bootstrapped"
else
  echo "  ⟳ Bootstrap returned no key (may already exist or bypass is on)"
  # Try without auth — works if ATLAS_AUTH_BYPASS=true
  TEST_RESP=$(curl -s -o /dev/null -w "%{http_code}" "$API/agents")
  if [ "$TEST_RESP" = "200" ]; then
    echo "  ✓ Auth bypass active, proceeding without key"
  else
    echo "  ✗ Cannot authenticate. Set ATLAS_AUTH_BYPASS=true or check your API key."
    exit 1
  fi
fi

# ── 3. Create test project directories ──────────────────────────────────────

echo ""
echo "→ Creating project directories..."
for name in taskflow-strict taskflow-minimal taskflow-opinionated; do
  dir="$TEST_DIR/$name"
  if [ -d "$dir" ]; then
    echo "  ⟳ $dir already exists, resetting..."
    rm -rf "$dir"
  fi
  mkdir -p "$dir"
  git -C "$dir" init -q
  echo "# TaskFlow ($name)" > "$dir/README.md"
  mkdir -p "$dir/src" "$dir/tests"
  echo '{ "name": "taskflow-'"$name"'", "version": "0.1.0", "private": true }' > "$dir/package.json"
  echo '{ "compilerOptions": { "strict": true, "target": "ES2022" } }' > "$dir/tsconfig.json"
  git -C "$dir" add .
  git -C "$dir" commit -q -m "Initial commit"
  echo "  ✓ $dir"
done

# ── 4. Create AI Providers ────────────────────────────────────────────────

echo ""
echo "→ Creating AI providers..."
PROVIDER_ANTHROPIC_ID=$(post "/agent-providers" '{
  "name": "Anthropic",
  "type": "anthropic",
  "apiKey": "REPLACE_ME",
  "baseUrl": null,
  "modelName": "claude-sonnet-4-20250514"
}' | jq_id)
echo "  ✓ Anthropic provider: $PROVIDER_ANTHROPIC_ID"

PROVIDER_OPENAI_ID=$(post "/agent-providers" '{
  "name": "OpenAI",
  "type": "openai",
  "apiKey": "REPLACE_ME",
  "baseUrl": null,
  "modelName": "gpt-4.1"
}' | jq_id)
echo "  ✓ OpenAI provider: $PROVIDER_OPENAI_ID"

echo "  ⚠  Update API keys in Settings → Providers"

# ── 5. Create Agents ───────────────────────────────────────────────────────

echo ""
echo "→ Creating agents..."

AGENT_STRICT_ID=$(post "/agents" '{
  "name": "Strict Engineer",
  "description": "Senior engineer with strict coding standards. Follows TDD, enforces types, writes comprehensive tests.",
  "personality": "You are a meticulous senior engineer. You never cut corners. Every function has types, every feature has tests, every PR is clean. You prefer explicit over implicit and correctness over speed.",
  "unbreakableRules": "Never use any type. Never skip tests. Never leave TODO comments.",
  "providerId": "'"$PROVIDER_ANTHROPIC_ID"'",
  "defaultModel": null
}' | jq_id)
echo "  ✓ Strict Engineer: $AGENT_STRICT_ID"

AGENT_MINIMAL_ID=$(post "/agents" '{
  "name": "Quick Builder",
  "description": "Fast-moving developer focused on shipping. Gets things working quickly with minimal ceremony.",
  "personality": "You are a pragmatic developer who focuses on shipping working code fast. You write clean code but dont over-engineer. Get the feature working first, optimize later.",
  "unbreakableRules": "",
  "providerId": "'"$PROVIDER_OPENAI_ID"'",
  "defaultModel": null
}' | jq_id)
echo "  ✓ Quick Builder: $AGENT_MINIMAL_ID"

AGENT_OPINIONATED_ID=$(post "/agents" '{
  "name": "Architecture Lead",
  "description": "Experienced architect who enforces layered architecture patterns. Focuses on clean separation of concerns.",
  "personality": "You are a software architect who values clean architecture above all. Every layer has a purpose, every module has clear boundaries. You design for maintainability and think in terms of systems, not just features.",
  "unbreakableRules": "Never skip layers in the architecture. Never put business logic in controllers.",
  "providerId": "'"$PROVIDER_ANTHROPIC_ID"'",
  "defaultModel": null
}' | jq_id)
echo "  ✓ Architecture Lead: $AGENT_OPINIONATED_ID"

AGENT_REVIEWER_ID=$(post "/agents" '{
  "name": "Code Reviewer",
  "description": "Dedicated code reviewer that checks for security, performance, and best practices.",
  "personality": "You are a thorough code reviewer. You catch bugs before they ship, flag security issues, and suggest performance improvements. You are constructive but firm.",
  "unbreakableRules": "Always check for SQL injection. Always check for unhandled errors. Always check for missing input validation.",
  "providerId": "'"$PROVIDER_ANTHROPIC_ID"'",
  "defaultModel": null
}' | jq_id)
echo "  ✓ Code Reviewer: $AGENT_REVIEWER_ID"

# ── 6. Create Projects ─────────────────────────────────────────────────────

echo ""
echo "→ Creating projects..."

PROJ_STRICT_ID=$(post "/projects" '{
  "name": "TaskFlow — Strict Engineering",
  "description": "A task management app built with strict engineering practices: full TypeScript strict mode, comprehensive tests, TDD workflow.",
  "techStack": "TypeScript, React 19, Hono, Drizzle ORM, SQLite, Tailwind CSS 4, Vitest",
  "status": "active",
  "localPath": "'"$TEST_DIR/taskflow-strict"'",
  "defaultBranch": "main",
  "agentBehavior": {
    "requireVerification": true,
    "enforceNoStubs": true,
    "workflowMode": "full",
    "autoAiReview": true,
    "approvalGates": { "brainstorm": true, "plan": true }
  },
  "mission": "Build a production-quality task management application with strict engineering standards. Every feature must have full test coverage and type safety."
}' | jq_id)
echo "  ✓ Strict: $PROJ_STRICT_ID"

PROJ_MINIMAL_ID=$(post "/projects" '{
  "name": "TaskFlow — Rapid Prototype",
  "description": "A task management app built with minimal rules — ship fast, iterate quickly. See how the agent performs with freedom.",
  "techStack": "TypeScript, React, Node.js",
  "status": "active",
  "localPath": "'"$TEST_DIR/taskflow-minimal"'",
  "defaultBranch": "main",
  "agentBehavior": {
    "requireVerification": false,
    "enforceNoStubs": false,
    "workflowMode": "off",
    "autoAiReview": false
  },
  "mission": "Build a task management application. Keep it simple and functional."
}' | jq_id)
echo "  ✓ Minimal: $PROJ_MINIMAL_ID"

PROJ_OPINIONATED_ID=$(post "/projects" '{
  "name": "TaskFlow — Clean Architecture",
  "description": "A task management app built with opinionated architecture: layered backend, component-driven frontend, clear module boundaries.",
  "techStack": "TypeScript, React 19, Hono, Drizzle ORM, SQLite, Tailwind CSS 4",
  "status": "active",
  "localPath": "'"$TEST_DIR/taskflow-opinionated"'",
  "defaultBranch": "main",
  "agentBehavior": {
    "requireVerification": true,
    "enforceNoStubs": true,
    "workflowMode": "full",
    "autoAiReview": false,
    "approvalGates": { "brainstorm": false, "plan": true }
  },
  "mission": "Build a well-architected task management application following clean architecture principles with clear layer separation."
}' | jq_id)
echo "  ✓ Opinionated: $PROJ_OPINIONATED_ID"

# ── 7. Assign Agents to Projects ───────────────────────────────────────────

echo ""
echo "→ Assigning agents to projects..."
post "/projects/$PROJ_STRICT_ID/agents" '{"agentId":"'"$AGENT_STRICT_ID"'","role":"lead"}' > /dev/null
post "/projects/$PROJ_STRICT_ID/agents" '{"agentId":"'"$AGENT_REVIEWER_ID"'","role":"reviewer"}' > /dev/null
post "/projects/$PROJ_MINIMAL_ID/agents" '{"agentId":"'"$AGENT_MINIMAL_ID"'","role":"lead"}' > /dev/null
post "/projects/$PROJ_OPINIONATED_ID/agents" '{"agentId":"'"$AGENT_OPINIONATED_ID"'","role":"lead"}' > /dev/null
post "/projects/$PROJ_OPINIONATED_ID/agents" '{"agentId":"'"$AGENT_REVIEWER_ID"'","role":"reviewer"}' > /dev/null
echo "  ✓ All agents assigned"

# ── 8. Create Phases ──────────────────────────────────────────────────────

echo ""
echo "→ Creating project phases..."

# Strict project phases
post "/phases" '{"projectId":"'"$PROJ_STRICT_ID"'","name":"Foundation","description":"Project setup, auth, and core infrastructure","status":"completed","orderIndex":0}' > /dev/null
post "/phases" '{"projectId":"'"$PROJ_STRICT_ID"'","name":"Core Features","description":"Task CRUD, kanban board, and search","status":"active","orderIndex":1}' > /dev/null
post "/phases" '{"projectId":"'"$PROJ_STRICT_ID"'","name":"Polish & Deploy","description":"UI refinements, performance, and deployment","status":"planning","orderIndex":2}' > /dev/null
echo "  ✓ 3 phases for Strict"

# Opinionated project phases
post "/phases" '{"projectId":"'"$PROJ_OPINIONATED_ID"'","name":"Architecture Design","description":"Define layers, data model, and API contracts","status":"completed","orderIndex":0}' > /dev/null
post "/phases" '{"projectId":"'"$PROJ_OPINIONATED_ID"'","name":"Backend Implementation","description":"Build the layered backend: routes, controllers, services, repositories","status":"active","orderIndex":1}' > /dev/null
post "/phases" '{"projectId":"'"$PROJ_OPINIONATED_ID"'","name":"Frontend Implementation","description":"Build the component-driven UI with hooks and state management","status":"planning","orderIndex":2}' > /dev/null
post "/phases" '{"projectId":"'"$PROJ_OPINIONATED_ID"'","name":"Integration & Testing","description":"End-to-end testing, architecture audit, and deployment","status":"planning","orderIndex":3}' > /dev/null
echo "  ✓ 4 phases for Opinionated"

# ── 9. Create Rules ────────────────────────────────────────────────────────

echo ""
echo "→ Creating rules..."

# --- Strict rules (5) ---

read -r -d '' RULE_TS_GUIDELINES << 'RULEEOF' || true
## TypeScript General Guidelines

### Basic Principles
- Use English for all code and documentation.
- Always declare the type of each variable and function (parameters and return value).
- Avoid using any.
- Create necessary types.
- Use JSDoc to document public classes and methods.
- One export per file.

### Nomenclature
- Use PascalCase for classes.
- Use camelCase for variables, functions, and methods.
- Use kebab-case for file and directory names.
- Use UPPERCASE for environment variables.
- Avoid magic numbers and define constants.
- Start each function with a verb.
- Use verbs for boolean variables: isLoading, hasError, canDelete.

### Functions
- Write short functions with a single purpose. Less than 20 instructions.
- Avoid nesting blocks by using early checks and returns.
- Use higher-order functions (map, filter, reduce) to avoid function nesting.
- Use arrow functions for simple functions (less than 3 instructions).
- Reduce function parameters using RO-RO (Receive an Object, Return an Object).
RULEEOF
post_rule "TypeScript General Guidelines" "Backend" '["typescript","types","naming","functions"]' "$RULE_TS_GUIDELINES" "$PROJ_STRICT_ID"

read -r -d '' RULE_VITEST << 'RULEEOF' || true
## Vitest Unit Testing Standards

### Best Practices
1. Critical Functionality: Prioritize testing business logic and utility functions.
2. Dependency Mocking: Always mock dependencies before imports with vi.mock().
3. Data Scenarios: Test valid inputs, invalid inputs, and edge cases.
4. Descriptive Naming: Use clear test names indicating expected behavior.
5. Test Organization: Group related tests in describe/context blocks.
6. Edge Cases: Include tests for undefined values, type mismatches, and unexpected inputs.
7. Use Arrange-Act-Assert pattern in every test.
8. Always clearAllMocks in beforeEach.
RULEEOF
post_rule "Vitest Unit Testing" "Testing" '["testing","vitest","unit-tests"]' "$RULE_VITEST" "$PROJ_STRICT_ID"

read -r -d '' RULE_CODE_QUALITY << 'RULEEOF' || true
## Code Quality Guidelines

### Key Mindsets
1. Simplicity: Write simple and straightforward code.
2. Readability: Ensure your code is easy to read and understand.
3. Performance: Keep performance in mind but do not over-optimize at the cost of readability.
4. Maintainability: Write code that is easy to maintain and update.
5. Testability: Ensure your code is easy to test.

### Code Rules
1. Utilize Early Returns to avoid nested conditions and improve readability.
2. Descriptive Names for variables and functions.
3. Correct and DRY Code: Focus on writing correct, best practice, DRY code.
4. Functional and Immutable Style: Prefer a functional, immutable style.
5. Lines of code = Debt. Less code is better.
RULEEOF
post_rule "Code Quality (10x Developer)" "General" '["quality","readability","dry","simplicity"]' "$RULE_CODE_QUALITY" "$PROJ_STRICT_ID"

post_rule "No Shortcuts Policy" "General" '["quality","standards"]' \
  "No TODO comments in merged code. No console.log - use a proper logger. No hardcoded values - use constants or env vars. No magic numbers. Every error must be handled explicitly. No suppressing TypeScript or linter errors. No any types." \
  "$PROJ_STRICT_ID"

post_rule "Code Review Standards" "General" '["review","quality","commits"]' \
  "Every PR must be self-contained and reviewable. Max 400 lines per PR. Commit messages follow conventional commits (feat:, fix:, refactor:, test:, docs:). Each commit does one thing. PRs must include tests for new functionality." \
  "$PROJ_STRICT_ID"

echo "  ✓ 5 strict rules"

# --- Minimal rules (1) ---
post_rule "Keep It Simple" "General" '["simple","pragmatic"]' \
  "Use TypeScript and React. Keep the code clean and readable. Do not over-engineer." \
  "$PROJ_MINIMAL_ID"

echo "  ✓ 1 minimal rule"

# --- Opinionated rules (4) ---
post_rule "Layered Architecture" "Backend" '["architecture","layers","separation"]' \
  "Follow a strict 4-layer architecture: Route > Controller > Service > Repository. Routes only define paths and validation. Controllers read the request and call services. Services contain business logic. Repositories handle database queries. Never skip layers." \
  "$PROJ_OPINIONATED_ID"

read -r -d '' RULE_REACT_PATTERNS << 'RULEEOF' || true
## React Component Patterns

### Core Rules
- Functions only (no classes). Less than 250 lines per component. One component per file.
- Favor Compound Components for complex state sharing.
- Controlled components for forms. Explicit TypeScript interfaces for all props.
- Avoid prop drilling - use Context or Zustand for deeply shared state.

### Organization
- pages/ for route components (compose features only).
- components/ for feature components with logic.
- components/ui/ for generic primitives (no domain logic).
- hooks/ for all data fetching and business logic.
- Components never call API directly - always through hooks.
RULEEOF
post_rule "React Component Patterns" "Frontend" '["react","components","patterns"]' "$RULE_REACT_PATTERNS" "$PROJ_OPINIONATED_ID"

read -r -d '' RULE_TS_BEST << 'RULEEOF' || true
## TypeScript Best Practices

### Patterns
- async/await with Promise.all() for concurrent operations.
- catch(e) typed as unknown, then narrow before use.
- Use never for exhaustiveness checks in switch-case statements.
- Optional chaining (?.) and nullish coalescing (??) over manual null checks.
- import type for type-only imports.

### Anti-patterns to Avoid
- No default exports. No any - use unknown and narrow.
- No require() - use ESM imports.
- No eslint-disable without a justifying comment.
RULEEOF
post_rule "TypeScript Best Practices" "Backend" '["typescript","patterns","naming"]' "$RULE_TS_BEST" "$PROJ_OPINIONATED_ID"

post_rule "Database Patterns" "Backend" '["database","drizzle","patterns"]' \
  "Use Drizzle ORM with SQLite. Every table gets its own schema file. Repository methods: findAll, findById, findByIdOrThrow, insert, update, remove. Always set updatedAt on updates. Use transactions for multi-table writes. Never access the database directly from controllers." \
  "$PROJ_OPINIONATED_ID"

echo "  ✓ 4 opinionated rules"

# ── 10. Create Skills ──────────────────────────────────────────────────────

echo ""
echo "→ Creating skills..."

# --- Strict skills (3) ---

read -r -d '' SKILL_TDD << 'SKILLEOF' || true
1. Read the task requirements and acceptance criteria carefully.
2. Write a failing test that covers the expected behavior (Red phase).
3. Run the test suite to confirm the new test fails.
4. Write the MINIMUM implementation code to make the failing test pass (Green phase).
5. Run tests again to confirm they pass.
6. Refactor the implementation while keeping all tests green (Refactor phase).
7. Add edge case tests: undefined values, empty inputs, type mismatches.
8. Run full test suite with coverage report.

## Mandatory Rules
- Never write production code without a failing test first.
- Every test must use AAA structure: Arrange, Act, Assert.
- Coverage thresholds: 80% statement/function/line, 75% branch.
SKILLEOF
post_skill "TDD (Red-Green-Refactor)" "Coding" "$SKILL_TDD" \
  "Task description with acceptance criteria and definition of done" \
  "Implementation code + test files + coverage report showing thresholds met" \
  "$PROJ_STRICT_ID"

read -r -d '' SKILL_REVIEW << 'SKILLEOF' || true
1. Review the diff or PR content thoroughly.
2. Check Security: injection risks, hardcoded secrets, auth leaks, improper input validation.
3. Check Efficiency: N+1 queries, memory leaks, unnecessary re-renders, Big O concerns.
4. Check Logic: requirements met, edge cases handled, error paths covered.
5. Check Types: no any, no untyped parameters, no assertions without justification.
6. Check Tests: every new function has tests, edge cases tested.
7. Tag each finding: [BLOCKER] (must fix), [MAJOR] (should fix), [NIT] (suggestion).
SKILLEOF
post_skill "Code Review" "Review" "$SKILL_REVIEW" \
  "Git diff or PR content" \
  "Severity-tagged review comments with file, issue, why, and fix" \
  "$PROJ_STRICT_ID"

read -r -d '' SKILL_PLANNING << 'SKILLEOF' || true
1. Analyze the task requirements and definition of done.
2. Identify affected layers: database, repository, service, controller, route, UI, hooks.
3. Break into sub-tasks of max 200 lines each.
4. Define implementation order: data model first, then API, then UI.
5. List test scenarios for each sub-task (happy path + error + edge cases).
6. Estimate complexity (S/M/L) for each sub-task.
7. Identify risks, dependencies, and potential blockers.
SKILLEOF
post_skill "Planning & Breakdown" "Planning" "$SKILL_PLANNING" \
  "Feature description or user story with acceptance criteria" \
  "Ordered list of sub-tasks with estimates, test scenarios, and dependency notes" \
  "$PROJ_STRICT_ID"

echo "  ✓ 3 strict skills"
echo "  ✓ 0 minimal skills (intentional)"

# --- Opinionated skills (2) ---

read -r -d '' SKILL_SYSTEM_DESIGN << 'SKILLEOF' || true
1. Identify bounded contexts and domain entities involved.
2. Define dependency direction: outer layers depend on inner layers, never the reverse.
3. Design the data model: entities, relationships, constraints.
4. Design the API contract: endpoints, request/response shapes, status codes.
5. Plan the layer structure: which services, repositories, controllers are needed.
6. Validate separation of concerns: no god classes, no circular dependencies.
7. Document key design decisions as Architecture Decision Records (ADRs).
SKILLEOF
post_skill "System Design" "Architecture / Data" "$SKILL_SYSTEM_DESIGN" \
  "Feature requirements and existing architecture context" \
  "Architecture document with data model, API contract, layer breakdown, and ADRs" \
  "$PROJ_OPINIONATED_ID"

read -r -d '' SKILL_ARCH_AUDIT << 'SKILLEOF' || true
1. Scan for structural duplication: ServiceV2 files, copy-paste patterns.
2. Detect logic leakage: business logic in controllers, DB queries in routes.
3. Check file sizes: UI >500 lines (Medium), >1000 lines (Critical).
4. Verify layer boundaries: Route > Controller > Service > Repository.
5. Check for circular dependencies between modules.
6. Score findings: -15 per layer violation, -10 per 1000+ line file.
7. Produce a health report with severity ratings and recommended refactoring actions.
SKILLEOF
post_skill "Architecture Audit" "Architecture / Data" "$SKILL_ARCH_AUDIT" \
  "Codebase file listing and key source files" \
  "Health score, severity-rated findings, and recommended refactoring actions" \
  "$PROJ_OPINIONATED_ID"

echo "  ✓ 2 opinionated skills"

# ── 11. Create Tasks (with status variety) ─────────────────────────────────

echo ""
echo "→ Creating tasks..."

# --- Strict project: realistic engineering tasks ---
post "/tasks" '{
  "name": "Set up project with TypeScript strict mode",
  "status": "Done",
  "priority": "High",
  "estimate": "M",
  "definitionOfDone": "TypeScript strict mode enabled. Biome linting configured. Vitest with coverage thresholds. CI pipeline running tests on push.",
  "notes": "Foundation task — sets the engineering standards for everything that follows.",
  "tags": ["setup", "typescript", "ci"],
  "projectId": "'"$PROJ_STRICT_ID"'",
  "agentId": "'"$AGENT_STRICT_ID"'"
}' > /dev/null

post "/tasks" '{
  "name": "Implement JWT authentication",
  "status": "Done",
  "priority": "High",
  "estimate": "L",
  "definitionOfDone": "Register and login endpoints. JWT tokens with refresh. Auth middleware protecting all routes. Login page with form validation.",
  "notes": "Use bcrypt for password hashing. Access tokens expire in 15 minutes, refresh tokens in 7 days.",
  "tags": ["auth", "security", "backend"],
  "projectId": "'"$PROJ_STRICT_ID"'",
  "agentId": "'"$AGENT_STRICT_ID"'"
}' > /dev/null

post "/tasks" '{
  "name": "Build task CRUD API with validation",
  "status": "In Progress",
  "priority": "High",
  "estimate": "M",
  "definitionOfDone": "Full CRUD for tasks. Zod validation on all inputs. Proper error responses. 100% test coverage on service layer.",
  "notes": "Tasks have: title, description, status (todo/in-progress/review/done), priority (low/medium/high/critical), due date, assignee.",
  "tags": ["backend", "api", "crud"],
  "projectId": "'"$PROJ_STRICT_ID"'",
  "agentId": "'"$AGENT_STRICT_ID"'"
}' > /dev/null

post "/tasks" '{
  "name": "Build Kanban board UI",
  "status": "In Progress",
  "priority": "High",
  "estimate": "L",
  "definitionOfDone": "Drag-and-drop Kanban board with 4 columns. Task cards showing title, priority badge, assignee avatar. Create task dialog. Responsive layout.",
  "notes": "Use @dnd-kit for drag-and-drop. Connect to the CRUD API.",
  "tags": ["frontend", "ui", "react", "dnd"],
  "projectId": "'"$PROJ_STRICT_ID"'",
  "agentId": "'"$AGENT_STRICT_ID"'"
}' > /dev/null

post "/tasks" '{
  "name": "Add search and filtering",
  "status": "To Do",
  "priority": "Medium",
  "estimate": "M",
  "definitionOfDone": "Search bar filtering by title and description. Filter dropdowns for status and priority. Filters persist in URL query params.",
  "tags": ["frontend", "backend", "search"],
  "projectId": "'"$PROJ_STRICT_ID"'",
  "agentId": "'"$AGENT_STRICT_ID"'"
}' > /dev/null

post "/tasks" '{
  "name": "Add due date reminders and notifications",
  "status": "Backlog",
  "priority": "Low",
  "estimate": "M",
  "definitionOfDone": "Visual indicators for overdue and upcoming tasks. Optional email notification for tasks due within 24 hours.",
  "tags": ["feature", "notifications"],
  "projectId": "'"$PROJ_STRICT_ID"'",
  "agentId": "'"$AGENT_STRICT_ID"'"
}' > /dev/null

echo "  ✓ 6 tasks for Strict (2 Done, 2 In Progress, 1 To Do, 1 Backlog)"

# --- Minimal project: quick-ship tasks ---
post "/tasks" '{
  "name": "Scaffold React + Node app",
  "status": "Done",
  "priority": "High",
  "estimate": "S",
  "definitionOfDone": "Working React frontend + Node backend. Hot reload. Basic routing.",
  "tags": ["setup"],
  "projectId": "'"$PROJ_MINIMAL_ID"'",
  "agentId": "'"$AGENT_MINIMAL_ID"'"
}' > /dev/null

post "/tasks" '{
  "name": "Build task list with add/edit/delete",
  "status": "In Progress",
  "priority": "High",
  "estimate": "M",
  "definitionOfDone": "Task list page. Add task form. Edit inline. Delete with confirmation. Data persists in SQLite.",
  "tags": ["fullstack", "crud"],
  "projectId": "'"$PROJ_MINIMAL_ID"'",
  "agentId": "'"$AGENT_MINIMAL_ID"'"
}' > /dev/null

post "/tasks" '{
  "name": "Add drag-and-drop status changes",
  "status": "To Do",
  "priority": "Medium",
  "estimate": "M",
  "definitionOfDone": "Drag tasks between status columns. Visual feedback during drag.",
  "tags": ["frontend", "dnd"],
  "projectId": "'"$PROJ_MINIMAL_ID"'",
  "agentId": "'"$AGENT_MINIMAL_ID"'"
}' > /dev/null

post "/tasks" '{
  "name": "Deploy to Vercel",
  "status": "Backlog",
  "priority": "Low",
  "estimate": "S",
  "definitionOfDone": "App deployed and accessible via public URL.",
  "tags": ["deploy"],
  "projectId": "'"$PROJ_MINIMAL_ID"'",
  "agentId": "'"$AGENT_MINIMAL_ID"'"
}' > /dev/null

echo "  ✓ 4 tasks for Minimal (1 Done, 1 In Progress, 1 To Do, 1 Backlog)"

# --- Opinionated project: architecture-focused tasks ---
post "/tasks" '{
  "name": "Design data model and API contracts",
  "status": "Done",
  "priority": "High",
  "estimate": "M",
  "definitionOfDone": "ERD for all entities. OpenAPI spec for all endpoints. ADR for key decisions.",
  "tags": ["architecture", "design", "api"],
  "projectId": "'"$PROJ_OPINIONATED_ID"'",
  "agentId": "'"$AGENT_OPINIONATED_ID"'"
}' > /dev/null

post "/tasks" '{
  "name": "Implement repository and service layers",
  "status": "In Progress",
  "priority": "High",
  "estimate": "L",
  "definitionOfDone": "Drizzle schema for tasks, users, and projects. Repository with CRUD ops. Service layer with business logic. Full test coverage.",
  "tags": ["backend", "architecture", "database"],
  "projectId": "'"$PROJ_OPINIONATED_ID"'",
  "agentId": "'"$AGENT_OPINIONATED_ID"'"
}' > /dev/null

post "/tasks" '{
  "name": "Build controller and route layers",
  "status": "To Do",
  "priority": "High",
  "estimate": "M",
  "definitionOfDone": "Hono routes with Zod validation. Controllers that call services. Proper error handling middleware. No business logic in controllers.",
  "tags": ["backend", "api", "architecture"],
  "projectId": "'"$PROJ_OPINIONATED_ID"'",
  "agentId": "'"$AGENT_OPINIONATED_ID"'"
}' > /dev/null

post "/tasks" '{
  "name": "Build component library and page shells",
  "status": "To Do",
  "priority": "Medium",
  "estimate": "L",
  "definitionOfDone": "Reusable UI primitives in components/ui/. Page shells in pages/. Custom hooks for API calls. No direct API calls in components.",
  "tags": ["frontend", "components", "architecture"],
  "projectId": "'"$PROJ_OPINIONATED_ID"'",
  "agentId": "'"$AGENT_OPINIONATED_ID"'"
}' > /dev/null

post "/tasks" '{
  "name": "Run architecture audit",
  "status": "Backlog",
  "priority": "Medium",
  "estimate": "S",
  "definitionOfDone": "Architecture audit report with health score. No layer violations. No god classes. All circular dependencies resolved.",
  "tags": ["architecture", "quality"],
  "projectId": "'"$PROJ_OPINIONATED_ID"'",
  "agentId": "'"$AGENT_REVIEWER_ID"'"
}' > /dev/null

echo "  ✓ 5 tasks for Opinionated (1 Done, 1 In Progress, 2 To Do, 1 Backlog)"

# ── 12. Create Memory Entries ──────────────────────────────────────────────

echo ""
echo "→ Creating memory entries..."

post "/memory" '{
  "name": "Drizzle ORM is preferred over Prisma",
  "content": "We chose Drizzle ORM over Prisma for the database layer. Reasons: better SQLite support, lighter bundle size, more control over queries, and it works well with the edge runtime. All new database work should use Drizzle.",
  "type": "Decision",
  "scope": "project",
  "projectId": "'"$PROJ_STRICT_ID"'"
}' > /dev/null

post "/memory" '{
  "name": "Use Zod for all API input validation",
  "content": "All API endpoints must validate request bodies using Zod schemas. Schemas live in the shared package and are used by both server (validation) and client (type inference). Never use manual type assertions for request data.",
  "type": "Convention",
  "scope": "global"
}' > /dev/null

post "/memory" '{
  "name": "Tailwind CSS 4 migration complete",
  "content": "The project has been migrated from Tailwind CSS 3 to Tailwind CSS 4. Key differences: no more tailwind.config.js (use CSS-based config), @apply still works, and the new color system uses oklch. All new components should use the v4 syntax.",
  "type": "Decision",
  "scope": "project",
  "projectId": "'"$PROJ_OPINIONATED_ID"'"
}' > /dev/null

post "/memory" '{
  "name": "SQLite WAL mode is always enabled",
  "content": "SQLite is configured with WAL (Write-Ahead Logging) mode for better concurrent read performance. This is set in the database initialization code. Do not change the journal mode.",
  "type": "Convention",
  "scope": "global"
}' > /dev/null

post "/memory" '{
  "name": "Toast notifications use Sonner",
  "content": "We use the Sonner library for toast notifications. Import toast from sonner. Use toast.success(), toast.error(), toast.info(). Always show success feedback on mutations and error feedback on failures.",
  "type": "Preference",
  "scope": "global"
}' > /dev/null

post "/memory" '{
  "name": "Git branch naming: feature/task-slug",
  "content": "All feature branches follow the pattern feature/<task-slug>. Atlas auto-generates branch names from task titles. Do not manually create branches with different naming patterns.",
  "type": "Convention",
  "scope": "global"
}' > /dev/null

echo "  ✓ 6 memory entries (2 project-scoped, 4 global)"

# ── 13. Create Quick Actions ──────────────────────────────────────────────

echo ""
echo "→ Creating quick actions..."

post "/quick-actions" '{
  "name": "Fix Bug",
  "description": "Investigate and fix a reported bug",
  "promptTemplate": "Investigate and fix the following bug:\n\n{{description}}\n\nSteps to reproduce:\n{{steps}}\n\nExpected behavior: {{expected}}\nActual behavior: {{actual}}\n\nWrite a fix with tests that verify the bug is resolved.",
  "icon": "Bug"
}' > /dev/null

post "/quick-actions" '{
  "name": "Add API Endpoint",
  "description": "Create a new REST API endpoint following the project patterns",
  "promptTemplate": "Create a new API endpoint:\n\nEndpoint: {{method}} {{path}}\nPurpose: {{description}}\n\nFollow the existing project patterns for route → controller → service → repository. Include Zod validation, error handling, and tests.",
  "icon": "Globe"
}' > /dev/null

post "/quick-actions" '{
  "name": "Write Tests",
  "description": "Add unit tests for existing code",
  "promptTemplate": "Write comprehensive unit tests for:\n\n{{target}}\n\nCover: happy path, error cases, edge cases, and boundary values. Use Vitest with the AAA pattern. Mock external dependencies.",
  "icon": "TestTube"
}' > /dev/null

post "/quick-actions" '{
  "name": "Refactor Module",
  "description": "Refactor a module for better readability and maintainability",
  "promptTemplate": "Refactor the following module:\n\n{{module}}\n\nGoals:\n- Improve readability and reduce complexity\n- Follow DRY and SOLID principles\n- Maintain all existing behavior (no functional changes)\n- Ensure all existing tests still pass",
  "icon": "Sparkles"
}' > /dev/null

echo "  ✓ 4 quick actions"

# ── 14. Create Global Instructions ────────────────────────────────────────

echo ""
echo "→ Creating global instructions..."

post "/settings/global-instructions" '{
  "content": "You are working on a TypeScript monorepo. Always use ESM imports (never require). Prefer named exports over default exports. Use async/await over raw promises. Handle all errors explicitly — never silently swallow exceptions. When creating new files, follow the existing directory structure and naming conventions."
}' > /dev/null

echo "  ✓ 1 global instruction"

# ── 15. Create Dispatch Rules ─────────────────────────────────────────────

echo ""
echo "→ Creating dispatch rules..."

post "/settings/dispatch-rules" '{
  "pattern": "bug|fix|broken|regression|crash",
  "agentId": "'"$AGENT_STRICT_ID"'",
  "skillId": null,
  "autoStart": false
}' > /dev/null

post "/settings/dispatch-rules" '{
  "pattern": "review|audit|check|inspect",
  "agentId": "'"$AGENT_REVIEWER_ID"'",
  "skillId": null,
  "autoStart": false
}' > /dev/null

echo "  ✓ 2 dispatch rules"

# ── Done ────────────────────────────────────────────────────────────────────

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   ✓ Seed complete!                                       ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║                                                           ║"
echo "║  3 projects × varied tasks = 15 tasks total               ║"
echo "║  4 agents (2 providers: Anthropic + OpenAI)               ║"
echo "║  10 rules, 5 skills, 7 phases                            ║"
echo "║  6 memory entries, 4 quick actions                        ║"
echo "║  1 global instruction, 2 dispatch rules                   ║"
echo "║                                                           ║"
echo "║  Config A: Strict Engineering                              ║"
echo "║    → 5 rules, 3 skills, 3 phases, workflow: full          ║"
echo "║    → Tasks: 2 Done, 2 In Progress, 1 To Do, 1 Backlog    ║"
echo "║                                                           ║"
echo "║  Config B: Rapid Prototype                                 ║"
echo "║    → 1 rule, 0 skills, 0 phases, workflow: off            ║"
echo "║    → Tasks: 1 Done, 1 In Progress, 1 To Do, 1 Backlog    ║"
echo "║                                                           ║"
echo "║  Config C: Clean Architecture                              ║"
echo "║    → 4 rules, 2 skills, 4 phases, workflow: full          ║"
echo "║    → Tasks: 1 Done, 1 In Progress, 2 To Do, 1 Backlog    ║"
echo "║                                                           ║"
echo "║  ⚠  Update your API keys in Settings → Providers          ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
