# Per-Step Commits — Prompt Compliance Matrix

Tracks executor compliance with the `step N/M: <title>` commit protocol introduced in PR #1.

## How to run a test

1. Create a sandbox project with a simple 5-step plan in Atlas.
2. Start an execute workspace using the target executor.
3. After completion, run:
   ```bash
   git -C <worktree_path> log base..HEAD \
     --format="%H %an <%ae> | %s" \
     --no-merges
   ```
4. Fill in the row below.

## Scoring criteria

| Metric | Pass | Fail |
|--------|------|------|
| **Compliant commits** | All steps produce `step N/M: <title>` commits | Missing or wrong format |
| **Author identity** | `Atlas Agent <atlas@local>` on every commit | User's git config identity |
| **Safety-net trigger** | 0 `execute: … (steps not tracked)` commits | ≥1 safety-net commit present |
| **Parse rate** | 100% `stepIndex` non-null in CommitsPanel | Any `stepIndex: null` on step commits |

Minimum acceptable threshold before PR #2: **≥4/5 steps compliant** and **author identity correct**.

---

## Results

<!-- One row per executor run. Copy the template row. -->

| Date | Executor | Version | Plan Steps | Compliant Commits | Parse Rate | Author Correct | Safety-net Fired | Notes |
|------|----------|---------|------------|-------------------|------------|----------------|------------------|-------|
| — | claude-code | — | 5 | — | — | — | — | pending alpha bake |
| — | gemini-cli | — | 5 | — | — | — | — | pending alpha bake |
| — | codex | — | 5 | — | — | — | — | pending alpha bake |

---

## Known issues / workarounds

_None yet — populate during alpha bake._

---

## Verification commands

```bash
# Check commit author identity on worktree branch
git -C <worktree_path> log base..HEAD --format='%an <%ae>'

# Count step-format commits
git -C <worktree_path> log base..HEAD --format='%s' | grep -cP '^step \d+/\d+: '

# Count safety-net commits
git -C <worktree_path> log base..HEAD --format='%s' | grep -c '(steps not tracked)'

# Full commit list with numstat
git -C <worktree_path> log base..HEAD --format='%h %an | %s' --numstat
```
