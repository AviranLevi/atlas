export interface RuleTemplate {
  name: string;
  type: string;
  tags: string[];
  content: string;
}

export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    name: 'TDD Enforcement',
    type: 'Testing',
    tags: ['tdd', 'tests', 'quality'],
    content: `Always follow the RED → GREEN → REFACTOR cycle:
1. Write a failing test that describes the expected behaviour BEFORE writing any implementation code.
2. Write the minimal implementation to make the test pass.
3. Refactor while keeping all tests green.

Do NOT mark a task done unless all tests pass. Run the full test suite before completing any task.
If you find yourself writing production code without a failing test first, stop and write the test.`,
  },
  {
    name: 'Verification Before Done',
    type: 'General',
    tags: ['verification', 'quality', 'completion'],
    content: `Before claiming a task is complete you MUST:
1. Run the project test command and confirm it exits with code 0.
2. Run the linter / typechecker if one is configured.
3. Include the full terminal output of these commands in your completion message.

Never self-certify with phrases like "it should work", "I'm confident", or "the tests will pass".
Evidence only. A task is done when the commands prove it.`,
  },
  {
    name: 'Systematic Debugging',
    type: 'General',
    tags: ['debugging', 'root-cause'],
    content: `When encountering an error or unexpected behaviour, follow this protocol before making any code change:

Phase 1 — Gather evidence:
- Read the full error message and stack trace carefully.
- Reproduce the error consistently.
- Identify what recently changed that could have caused it.

Phase 2 — Form a hypothesis:
- State one specific root cause hypothesis.
- Predict what you would observe if the hypothesis is correct.

Phase 3 — Test and fix:
- Change one thing at a time and verify whether it matches your prediction.
- Never change multiple things simultaneously — you won't know what fixed it.

Symptom fixes are not solutions. Always identify and fix the root cause.`,
  },
  {
    name: 'No Stubs or Placeholders',
    type: 'General',
    tags: ['quality', 'completeness'],
    content: `Every line of code you submit must be functional. Never leave:
- TODO or FIXME comments without an accompanying task
- Placeholder values (e.g. "your-api-key", "TODO: implement this")
- Stub implementations (functions that return null / throw "not implemented")
- Commented-out code blocks

If something is genuinely out of scope, document it as a separate task on the Kanban board, not as a comment in the code.`,
  },
  {
    name: 'Context-Complete Sub-tasks',
    type: 'General',
    tags: ['tasks', 'planning'],
    content: `When creating sub-tasks or follow-up tasks, every task description must be self-contained:
- Include the relevant file paths (e.g. src/components/Foo.tsx, src/hooks/use-foo.ts)
- Include the exact command to verify the work (e.g. npm test, cargo test)
- Include all context needed to work on the task independently
- Never write "similar to the previous task" or reference other tasks by implication

Assume the agent working on the sub-task has zero context about what came before.`,
  },
  {
    name: 'Commit Hygiene',
    type: 'Backend',
    tags: ['git', 'commits'],
    content: `Keep commits small and atomic:
- Each commit should represent one logical change.
- Commit messages must explain WHY, not just WHAT. Bad: "fix bug". Good: "fix race condition in token refresh when multiple tabs open".
- Never commit commented-out code.
- Never commit debug console.log / print statements.
- If you discover unrelated issues while working, create a task for them — do not fix them in the same commit.`,
  },
  {
    name: 'Error Handling',
    type: 'Backend',
    tags: ['errors', 'reliability'],
    content: `Never silently swallow errors. Every catch block must do one of:
1. Re-throw the error (possibly wrapped with additional context)
2. Log the error with enough context to diagnose it (file, function, relevant IDs)
3. Explicitly handle the error case and document why silencing is intentional

Avoid broad catch-all handlers. Catch the specific error types you expect.
Validate external inputs at system boundaries (HTTP handlers, CLI args, file reads). Do not re-validate internally.`,
  },
  {
    name: 'Frontend Conventions',
    type: 'Frontend',
    tags: ['react', 'components', 'hooks'],
    content: `Component rules:
- Components must never call API functions directly — all data fetching goes through custom hooks.
- No inline styles. Use Tailwind utility classes only.
- Use the cn() utility for conditional class names.
- Keep components under ~150 lines. If longer, extract logic into a hook or sub-component.

Hook rules:
- One resource key constant per hook file.
- Mutations must invalidate relevant queries on success.
- Always show errors — never silently swallow mutation failures.

Dialogs receive open/onOpenChange as props — the parent owns open state.`,
  },
];
