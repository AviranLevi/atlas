#!/usr/bin/env bash
# seed-test-projects.sh
# Sets up 3 parallel test projects with different agent/rule/skill configs.
# Usage: bash scripts/seed-test-projects.sh

set -euo pipefail

API="http://localhost:3100/api/v1"
TEST_DIR="$HOME/Documents/Projects/test-builds"

# ── Helpers ──────────────────────────────────────────────────────────────────

post() {
  local endpoint="$1" body="$2"
  curl -s -X POST "$API$endpoint" \
    -H "Content-Type: application/json" \
    -d "$body"
}

put() {
  local endpoint="$1" body="$2"
  curl -s -X PUT "$API$endpoint" \
    -H "Content-Type: application/json" \
    -d "$body"
}

jq_id() { python3 -c "import sys,json; print(json.loads(sys.stdin.read())['id'])"; }

# Post a rule: post_rule <name> <type> <tags_json> <content> <projectId>
post_rule() {
  local name="$1" type="$2" tags="$3" content="$4" pid="$5"
  python3 -c "
import json, sys, urllib.request
body = json.dumps({'name': sys.argv[1], 'type': sys.argv[2], 'tags': json.loads(sys.argv[3]), 'content': sys.argv[4], 'projectId': sys.argv[5]})
req = urllib.request.Request(sys.argv[6], data=body.encode(), headers={'Content-Type': 'application/json'})
urllib.request.urlopen(req)
" "$name" "$type" "$tags" "$content" "$pid" "$API/rules"
}

# Post a skill: post_skill <name> <type> <steps> <inputFormat> <outputFormat> <projectId>
post_skill() {
  local name="$1" type="$2" steps="$3" input="$4" output="$5" pid="$6"
  python3 -c "
import json, sys, urllib.request
body = json.dumps({'name': sys.argv[1], 'type': sys.argv[2], 'steps': sys.argv[3], 'inputFormat': sys.argv[4], 'outputFormat': sys.argv[5], 'projectId': sys.argv[6]})
req = urllib.request.Request(sys.argv[7], data=body.encode(), headers={'Content-Type': 'application/json'})
urllib.request.urlopen(req)
" "$name" "$type" "$steps" "$input" "$output" "$pid" "$API/skills"
}

echo "╔══════════════════════════════════════════╗"
echo "║   Atlas Test Projects Seed Script        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Check server ─────────────────────────────────────────────────────────

echo "→ Checking server..."
if ! curl -s "$API/" > /dev/null 2>&1; then
  echo "✗ Server not reachable at $API. Start it first."
  exit 1
fi
echo "  ✓ Server is running"

# ── 2. Create test project directories ──────────────────────────────────────

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
  git -C "$dir" add .
  git -C "$dir" commit -q -m "Initial commit"
  echo "  ✓ $dir"
done

# ── 3. Create AI Provider ──────────────────────────────────────────────────

echo ""
echo "→ Creating AI provider..."
PROVIDER_ID=$(post "/agent-providers" '{
  "name": "Anthropic",
  "type": "anthropic",
  "apiKey": "REPLACE_ME",
  "baseUrl": "https://api.anthropic.com",
  "modelName": "claude-sonnet-4-20250514"
}' | jq_id)
echo "  ✓ Provider: $PROVIDER_ID"
echo "  ⚠  Update the API key in Settings → Providers"

# ── 4. Create Agents ───────────────────────────────────────────────────────

echo ""
echo "→ Creating agents..."

AGENT_STRICT_ID=$(post "/agents" '{
  "name": "Strict Engineer",
  "description": "Senior engineer with strict coding standards. Follows TDD, enforces types, writes comprehensive tests.",
  "personality": "You are a meticulous senior engineer. You never cut corners. Every function has types, every feature has tests, every PR is clean. You prefer explicit over implicit and correctness over speed.",
  "unbreakableRules": "Never use any type. Never skip tests. Never leave TODO comments.",
  "providerId": "'"$PROVIDER_ID"'",
  "defaultModel": "claude-sonnet-4-20250514"
}' | jq_id)
echo "  ✓ Strict Engineer: $AGENT_STRICT_ID"

AGENT_MINIMAL_ID=$(post "/agents" '{
  "name": "Quick Builder",
  "description": "Fast-moving developer focused on shipping. Gets things working quickly with minimal ceremony.",
  "personality": "You are a pragmatic developer who focuses on shipping working code fast. You write clean code but dont over-engineer. Get the feature working first, optimize later.",
  "unbreakableRules": "",
  "providerId": "'"$PROVIDER_ID"'",
  "defaultModel": "claude-sonnet-4-20250514"
}' | jq_id)
echo "  ✓ Quick Builder: $AGENT_MINIMAL_ID"

AGENT_OPINIONATED_ID=$(post "/agents" '{
  "name": "Architecture Lead",
  "description": "Experienced architect who enforces layered architecture patterns. Focuses on clean separation of concerns.",
  "personality": "You are a software architect who values clean architecture above all. Every layer has a purpose, every module has clear boundaries. You design for maintainability and think in terms of systems, not just features.",
  "unbreakableRules": "Never skip layers in the architecture. Never put business logic in controllers.",
  "providerId": "'"$PROVIDER_ID"'",
  "defaultModel": "claude-sonnet-4-20250514"
}' | jq_id)
echo "  ✓ Architecture Lead: $AGENT_OPINIONATED_ID"

# ── 5. Create Projects ─────────────────────────────────────────────────────

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
  "name": "TaskFlow — Minimal Guidance",
  "description": "A task management app built with minimal rules — just ship it. See how the agent performs with freedom.",
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
  "name": "TaskFlow — Opinionated Stack",
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

# ── 6. Assign Agents to Projects ───────────────────────────────────────────

echo ""
echo "→ Assigning agents to projects..."
post "/projects/$PROJ_STRICT_ID/agents" '{"agentId":"'"$AGENT_STRICT_ID"'","role":"lead"}' > /dev/null
post "/projects/$PROJ_MINIMAL_ID/agents" '{"agentId":"'"$AGENT_MINIMAL_ID"'","role":"lead"}' > /dev/null
post "/projects/$PROJ_OPINIONATED_ID/agents" '{"agentId":"'"$AGENT_OPINIONATED_ID"'","role":"lead"}' > /dev/null
echo "  ✓ All agents assigned"

# ── 7. Create Rules ────────────────────────────────────────────────────────

echo ""
echo "→ Creating rules..."

# --- Strict rules (5) ---

# Source: awesome-cursorrules (typescript-nestjs — TS General Guidelines section)
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
- Use complete words instead of abbreviations (except standard ones like API, URL, i/j for loops, err for errors, ctx for contexts, req/res/next for middleware).

### Functions
- Write short functions with a single purpose. Less than 20 instructions.
- Name functions with a verb and something else.
- Avoid nesting blocks by using early checks and returns, and extraction to utility functions.
- Use higher-order functions (map, filter, reduce) to avoid function nesting.
- Use arrow functions for simple functions (less than 3 instructions).
- Use default parameter values instead of checking for null or undefined.
- Reduce function parameters using RO-RO (Receive an Object, Return an Object).
- Use a single level of abstraction.

### Data
- Prefer immutability for data.
- Use readonly for data that doesn't change.
- Use as const for literals that don't change.

### Classes
- Follow SOLID principles.
- Prefer composition over inheritance.
- Declare interfaces to define contracts.
- Write small classes with a single purpose: less than 200 instructions, less than 10 public methods, less than 10 properties.

### Exceptions
- Use exceptions to handle errors you don't expect.
- If you catch an exception, it should be to fix an expected problem or add context. Otherwise, use a global handler.

### Testing
- Follow the Arrange-Act-Assert convention for tests.
- Name test variables clearly: inputX, mockX, actualX, expectedX.
- Write unit tests for each public function.
- Use test doubles to simulate dependencies (except for cheap third-party deps).
- Write acceptance tests for each module using Given-When-Then convention.
RULEEOF
post_rule "TypeScript General Guidelines" "Backend" '["typescript","types","naming","functions","solid"]' "$RULE_TS_GUIDELINES" "$PROJ_STRICT_ID"

# Source: awesome-cursorrules (vitest-unit-testing)
read -r -d '' RULE_VITEST << 'RULEEOF' || true
## Vitest Unit Testing Standards

### Focus
- Create unit tests that focus on critical functionality (business logic, utility functions).
- Mock dependencies (API calls, external modules) before imports using vi.mock.
- Test various data scenarios: valid inputs, invalid inputs, edge cases.
- Write maintainable tests with descriptive names grouped in describe blocks.

### Best Practices
1. Critical Functionality: Prioritize testing business logic and utility functions.
2. Dependency Mocking: Always mock dependencies before imports with vi.mock().
3. Data Scenarios: Test valid inputs, invalid inputs, and edge cases.
4. Descriptive Naming: Use clear test names indicating expected behavior.
5. Test Organization: Group related tests in describe/context blocks.
6. Project Patterns: Match team testing conventions and patterns.
7. Edge Cases: Include tests for undefined values, type mismatches, and unexpected inputs.
8. Limit to 3-5 focused tests per file for maintainability.
9. Use Arrange-Act-Assert pattern in every test.
10. Always clearAllMocks in beforeEach.
RULEEOF
post_rule "Vitest Unit Testing" "Testing" '["testing","vitest","unit-tests","mocking"]' "$RULE_VITEST" "$PROJ_STRICT_ID"

# Source: awesome-cursorrules (javascript-typescript-code-quality — 10x dev)
read -r -d '' RULE_CODE_QUALITY << 'RULEEOF' || true
## Code Quality Guidelines

### Key Mindsets
1. Simplicity: Write simple and straightforward code.
2. Readability: Ensure your code is easy to read and understand.
3. Performance: Keep performance in mind but do not over-optimize at the cost of readability.
4. Maintainability: Write code that is easy to maintain and update.
5. Testability: Ensure your code is easy to test.
6. Reusability: Write reusable components and functions.

### Code Rules
1. Utilize Early Returns: Use early returns to avoid nested conditions and improve readability.
2. Descriptive Names: Use descriptive names for variables and functions. Prefix event handler functions with handle (e.g., handleClick, handleKeyDown).
3. Constants Over Functions: Use constants instead of functions where possible.
4. Correct and DRY Code: Focus on writing correct, best practice, DRY code.
5. Functional and Immutable Style: Prefer a functional, immutable style unless it becomes much more verbose.
6. Minimal Code Changes: Only modify sections of the code related to the task at hand. Avoid modifying unrelated pieces of code.
7. Lines of code = Debt. Less code is better.

### Comments and Documentation
- Add a comment at the start of each function describing what it does.
- Comments should describe purpose, not effect.
RULEEOF
post_rule "Code Quality (10x Developer)" "General" '["quality","readability","dry","simplicity"]' "$RULE_CODE_QUALITY" "$PROJ_STRICT_ID"

post_rule "No Shortcuts Policy" "General" '["quality","standards","enforcement"]' \
  "No TODO comments in merged code. No console.log - use a proper logger. No hardcoded values - use constants or env vars. No magic numbers. Every error must be handled explicitly. No suppressing TypeScript or linter errors. No any types. No type assertions without a justifying comment." \
  "$PROJ_STRICT_ID"

post_rule "Code Review Standards" "General" '["review","quality","commits"]' \
  "Every PR must be self-contained and reviewable. Max 400 lines per PR. Commit messages follow conventional commits (feat:, fix:, refactor:, test:, docs:). Each commit does one thing. PRs must include tests for new functionality." \
  "$PROJ_STRICT_ID"

echo "  ✓ 5 strict rules (3 community + 2 custom)"

# --- Minimal rules (1) ---
post_rule "Keep It Simple" "General" '["simple","pragmatic"]' \
  "Use TypeScript and React. Keep the code clean and readable. Do not over-engineer." \
  "$PROJ_MINIMAL_ID"

echo "  ✓ 1 minimal rule"

# --- Opinionated rules (4) ---
post_rule "Layered Architecture" "Backend" '["architecture","layers","separation"]' \
  "Follow a strict 4-layer architecture: Route > Controller > Service > Repository. Routes only define paths and validation. Controllers read the request and call services. Services contain business logic. Repositories handle database queries. Never skip layers. Controllers never import db or schema tables. Routes never contain logic or direct data access." \
  "$PROJ_OPINIONATED_ID"

# Source: agent-skills-standard (react-component-patterns)
read -r -d '' RULE_REACT_PATTERNS << 'RULEEOF' || true
## React Component Patterns

### Core Rules
- Functions only (no classes). Less than 250 lines per component. One component per file. Named exports only. PascalCase for component names.
- Favor Compound Components for complex state sharing.
- Use HOC for cross-cutting concerns (e.g., withAuth).
- Slots/Render Props over deep prop hierarchies.

### Props and State
- Controlled components for forms (favor controlled over uncontrolled).
- Explicit TypeScript interfaces for all props.
- Avoid prop drilling - use Context or Zustand for deeply shared state.
- Use ternary over && for conditional rendering (prevents the 0 rendering bug).

### Organization
- pages/ for route components (compose features only).
- components/ for feature components with logic.
- components/ui/ for generic primitives (no domain logic).
- hooks/ for all data fetching and business logic.
- Components never call API directly - always through hooks.
RULEEOF
post_rule "React Component Patterns" "Frontend" '["react","components","patterns","architecture"]' "$RULE_REACT_PATTERNS" "$PROJ_OPINIONATED_ID"

# Source: agent-skills-standard (typescript-best-practices)
read -r -d '' RULE_TS_BEST << 'RULEEOF' || true
## TypeScript Best Practices

### Naming Conventions
- PascalCase for types/interfaces, camelCase for variables/functions, UPPER_SNAKE_CASE for constants.
- Named exports only. Arrow functions for callbacks, function declarations for top-level exports.

### Patterns
- async/await with Promise.all() for concurrent operations.
- catch(e) typed as unknown, then narrow before use.
- Use never for exhaustiveness checks in switch-case statements.
- Optional chaining (?.) and nullish coalescing (??) over manual null checks.
- import type for type-only imports.

### Classes
- Explicit access modifiers (public/private/protected).
- Composition over inheritance.
- Constructor dependency injection.

### Validation
- Use Zod for runtime boundary validation (API inputs, external data).
- Trust internal types - only validate at system boundaries.

### Anti-patterns to Avoid
- No default exports.
- No implicit returns in multi-line functions.
- No any - use unknown and narrow.
- No require() - use ESM imports.
- No eslint-disable without a justifying comment.
RULEEOF
post_rule "TypeScript Best Practices" "Backend" '["typescript","patterns","naming","validation"]' "$RULE_TS_BEST" "$PROJ_OPINIONATED_ID"

post_rule "Database Patterns" "Backend" '["database","drizzle","patterns"]' \
  "Use Drizzle ORM with SQLite. Every table gets its own schema file. Repository methods: findAll, findById, findByIdOrThrow, insert, update, remove. Always set updatedAt on updates. Use transactions for multi-table writes. Never access the database directly from controllers or routes." \
  "$PROJ_OPINIONATED_ID"

echo "  ✓ 4 opinionated rules (2 community + 2 custom)"

# ── 8. Create Skills ───────────────────────────────────────────────────────

echo ""
echo "→ Creating skills..."

# --- Strict skills (3) ---

# Source: agent-skills-standard (common-tdd)
read -r -d '' SKILL_TDD << 'SKILLEOF' || true
1. Read the task requirements and acceptance criteria carefully.
2. Write a failing test that covers the expected behavior (Red phase).
3. Run the test suite to confirm the new test fails - verify the failure message matches expectations.
4. Write the MINIMUM implementation code to make the failing test pass (Green phase).
5. Run tests again to confirm they pass.
6. Refactor the implementation while keeping all tests green (Refactor phase).
7. Add edge case tests: undefined values, empty inputs, type mismatches, error paths.
8. Run full test suite with coverage report.

## Mandatory Rules
- Never write production code without a failing test first (Iron Law).
- Every test must use AAA structure: Arrange, Act, Assert.
- Coverage thresholds: 80% statement/function/line, 75% branch.
- Always mock: HTTP calls, Time/Date, Filesystem access.
- Never mock: fast internal services or pure domain logic.

## Anti-patterns to Avoid
- Writing tests after implementation.
- Assertion-free tests (tests that don't actually assert anything).
- Testing implementation details instead of behavior.
- Mocking everything - only mock external boundaries.
SKILLEOF
post_skill "TDD (Red-Green-Refactor)" "Coding" "$SKILL_TDD" \
  "Task description with acceptance criteria and definition of done" \
  "Implementation code + test files + coverage report showing thresholds met" \
  "$PROJ_STRICT_ID"

# Source: agent-skills-standard (common-code-review)
read -r -d '' SKILL_REVIEW << 'SKILLEOF' || true
1. Review the diff or PR content thoroughly.
2. Check Security: injection risks, hardcoded secrets, auth leaks, improper input validation.
3. Check Efficiency: N+1 queries, memory leaks, unnecessary re-renders, Big O concerns.
4. Check Logic: requirements met, edge cases handled, error paths covered.
5. Check Clean Code: DRY/SOLID principles, naming clarity, separation of concerns.
6. Check Types: no any, no untyped parameters, no assertions without justification.
7. Check Tests: every new function has tests, edge cases tested.
8. Tag each finding with severity: [BLOCKER] (must fix), [MAJOR] (should fix), [NIT] (suggestion).
9. Format: [SEVERITY] [File:Line] Issue Description / Why it matters / Suggested fix.

## Anti-patterns to Avoid
- Nitpicking code style when logic is the concern.
- Vague demands without specifics.
- Skimming over test files - tests deserve the same review rigor.
- Approving without actually reading the full diff.
SKILLEOF
post_skill "Code Review" "Review" "$SKILL_REVIEW" \
  "Git diff or PR content" \
  "Severity-tagged review comments: [BLOCKER]/[MAJOR]/[NIT] with file, issue, why, and fix" \
  "$PROJ_STRICT_ID"

# Custom skill
read -r -d '' SKILL_PLANNING << 'SKILLEOF' || true
1. Analyze the task requirements and definition of done.
2. Identify affected layers: database schema, repository, service, controller, route, UI components, hooks.
3. Break into sub-tasks of max 200 lines each.
4. Define implementation order: data model first, then API, then UI.
5. List test scenarios for each sub-task (happy path + error cases + edge cases).
6. Estimate complexity (S/M/L) for each sub-task.
7. Identify risks, dependencies, and potential blockers.
8. Produce an ordered checklist ready for execution.
SKILLEOF
post_skill "Planning & Breakdown" "Planning" "$SKILL_PLANNING" \
  "Feature description or user story with acceptance criteria" \
  "Ordered list of sub-tasks with estimates, test scenarios, and dependency notes" \
  "$PROJ_STRICT_ID"

echo "  ✓ 3 strict skills (2 community + 1 custom)"

# --- Minimal: no skills ---
echo "  ✓ 0 minimal skills (intentional)"

# --- Opinionated skills (2) ---

# Source: agent-skills-standard (common-system-design)
read -r -d '' SKILL_SYSTEM_DESIGN << 'SKILLEOF' || true
1. Identify bounded contexts and domain entities involved.
2. Define dependency direction: outer layers depend on inner layers, never the reverse.
3. Select communication patterns: sync REST for queries, async events for side effects, hybrid where appropriate.
4. Design the data model: entities, relationships, constraints.
5. Design the API contract: endpoints, request/response shapes, status codes.
6. Plan the layer structure: which services, repositories, controllers are needed.
7. Identify shared utilities and cross-cutting concerns.
8. Validate separation of concerns: no god classes, no circular dependencies.
9. Document key design decisions as Architecture Decision Records (ADRs).

## Principles
- Separation of Concerns: each module has one reason to change.
- Single Source of Truth: every piece of data has one authoritative owner.
- Fail Fast: validate early, surface errors immediately.
- Graceful Degradation: handle failures without cascading.

## Anti-patterns to Avoid
- God classes (>500 lines doing everything).
- Synchronous coupling across services.
- Premature abstraction (do not abstract until you have 3+ concrete cases).
- Skipping layers in the architecture.
SKILLEOF
post_skill "System Design" "Architecture / Data" "$SKILL_SYSTEM_DESIGN" \
  "Feature requirements and existing architecture context" \
  "Architecture document with data model, API contract, layer breakdown, component tree, and ADRs" \
  "$PROJ_OPINIONATED_ID"

# Source: agent-skills-standard (common-architecture-audit)
read -r -d '' SKILL_ARCH_AUDIT << 'SKILLEOF' || true
1. Scan for structural duplication: ServiceV2 files, /v1 /v2 folders, copy-paste patterns.
2. Detect logic leakage: business logic in controllers, DB queries in routes, API calls in components.
3. Check monolith indicators: UI files >500 lines (Medium), >1000 lines (Critical). Backend files >1000 lines (Medium), >1500 lines (Critical/God Class).
4. Verify layer boundaries: Route > Controller > Service > Repository. No skipping.
5. Check for circular dependencies between modules.
6. Assess hook/component ratio: if components folder has 20x more hooks than hooks folder, architecture is monolithic.
7. Score findings: -15 per layer violation, -10 per duplicated legacy entity, -10 per 1000+ line file.
8. Produce a health report with severity ratings and recommended refactoring actions.

## What to Flag
- God classes: files doing too many things.
- Layer violations: controllers accessing DB, routes containing logic.
- Structural duplication: same pattern implemented differently in two places.
- Missing abstractions: repeated inline logic that should be a shared utility.
SKILLEOF
post_skill "Architecture Audit" "Architecture / Data" "$SKILL_ARCH_AUDIT" \
  "Codebase file listing and key source files" \
  "Health score, severity-rated findings, and recommended refactoring actions" \
  "$PROJ_OPINIONATED_ID"

echo "  ✓ 2 opinionated skills (2 community)"

# ── 9. Create Tasks ────────────────────────────────────────────────────────

echo ""
echo "→ Creating tasks..."

create_tasks() {
  local proj_id="$1" agent_id="$2" workflow="$3"

  local wf_enabled="false" wf_stage="null"
  if [ "$workflow" = "true" ]; then
    wf_enabled="true"
    wf_stage='"brainstorm"'
  fi

  post "/tasks" '{
    "name": "Initialize project with authentication",
    "status": "To Do",
    "priority": "High",
    "estimate": "L",
    "definitionOfDone": "Project scaffolded with TypeScript, React frontend, Hono backend, SQLite database. User registration and login endpoints working. JWT-based auth middleware. Login page in the UI.",
    "notes": "Start from scratch. Set up the full project structure, install dependencies, configure TypeScript, and implement basic auth (register, login, protected routes).",
    "tags": ["setup", "auth", "backend", "frontend"],
    "projectId": "'"$proj_id"'",
    "agentId": "'"$agent_id"'",
    "workflowEnabled": '"$wf_enabled"',
    "workflowStage": '"$wf_stage"'
  }' > /dev/null

  post "/tasks" '{
    "name": "Build task CRUD API",
    "status": "Backlog",
    "priority": "High",
    "estimate": "M",
    "definitionOfDone": "Full CRUD API for tasks: create, read (list + single), update, delete. Tasks have: title, description, status (todo/in-progress/done), priority (low/medium/high), due date, assigned user. All endpoints protected by auth.",
    "notes": "Build the backend API for task management. Include proper validation, error handling, and database schema.",
    "tags": ["backend", "api", "crud"],
    "projectId": "'"$proj_id"'",
    "agentId": "'"$agent_id"'",
    "workflowEnabled": '"$wf_enabled"',
    "workflowStage": '"$wf_stage"'
  }' > /dev/null

  post "/tasks" '{
    "name": "Build task management UI",
    "status": "Backlog",
    "priority": "Medium",
    "estimate": "L",
    "definitionOfDone": "Task list page showing all tasks with status badges and priority indicators. Task creation form in a dialog. Task detail view with edit capability. Status change via dropdown or drag. Responsive layout.",
    "notes": "Create the frontend UI for managing tasks. Should connect to the CRUD API built in the previous task.",
    "tags": ["frontend", "ui", "react"],
    "projectId": "'"$proj_id"'",
    "agentId": "'"$agent_id"'",
    "workflowEnabled": '"$wf_enabled"',
    "workflowStage": '"$wf_stage"'
  }' > /dev/null

  post "/tasks" '{
    "name": "Add search and filtering",
    "status": "Backlog",
    "priority": "Medium",
    "estimate": "M",
    "definitionOfDone": "Search bar that filters tasks by title and description. Filter dropdowns for status, priority, and assigned user. Filters persist in URL query params. Server-side filtering for efficiency. Clear filters button.",
    "notes": "Add search and filtering capabilities to the task management UI and API.",
    "tags": ["frontend", "backend", "search", "filters"],
    "projectId": "'"$proj_id"'",
    "agentId": "'"$agent_id"'",
    "workflowEnabled": '"$wf_enabled"',
    "workflowStage": '"$wf_stage"'
  }' > /dev/null
}

create_tasks "$PROJ_STRICT_ID" "$AGENT_STRICT_ID" "true"
echo "  ✓ 4 tasks for Strict (workflow: full, stage: brainstorm)"

create_tasks "$PROJ_MINIMAL_ID" "$AGENT_MINIMAL_ID" "false"
echo "  ✓ 4 tasks for Minimal (workflow: off)"

create_tasks "$PROJ_OPINIONATED_ID" "$AGENT_OPINIONATED_ID" "true"
echo "  ✓ 4 tasks for Opinionated (workflow: full, stage: brainstorm)"

# ── Done ────────────────────────────────────────────────────────────────────

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║   ✓ Seed complete!                              ║"
echo "╠═══════════════════════════════════════════════╣"
echo "║                                                 ║"
echo "║  3 projects × 4 tasks = 12 tasks total          ║"
echo "║                                                 ║"
echo "║  Config A: Strict Engineering                    ║"
echo "║    → 5 rules, 3 skills, workflow: full           ║"
echo "║    → Sources: awesome-cursorrules,               ║"
echo "║      agent-skills-standard, custom               ║"
echo "║                                                 ║"
echo "║  Config B: Minimal Guidance                      ║"
echo "║    → 1 rule, 0 skills, workflow: off             ║"
echo "║                                                 ║"
echo "║  Config C: Opinionated Stack                     ║"
echo "║    → 4 rules, 2 skills, workflow: full           ║"
echo "║    → Sources: agent-skills-standard, custom      ║"
echo "║                                                 ║"
echo "║  ⚠  Update your Anthropic API key in            ║"
echo "║     Settings → Providers                         ║"
echo "║                                                 ║"
echo "╚═══════════════════════════════════════════════╝"
