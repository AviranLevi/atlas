import type { QuickActionTemplate } from '@atlas/shared';

export const QUICK_ACTION_TEMPLATES: QuickActionTemplate[] = [
  {
    key: 'update-readme',
    name: 'Update README',
    description: 'Update the README and other docs to reflect recent changes',
    promptTemplate:
      'Review the current state of the project and recent changes. Update the README.md and any other relevant documentation to accurately reflect the current project state, setup instructions, and features.',
    icon: 'FileText',
  },
  {
    key: 'fix-lint-errors',
    name: 'Fix Lint Errors',
    description: 'Run the linter and type checker, then auto-fix issues',
    promptTemplate:
      'Run the project linter and type checker. Identify all errors and warnings, then fix as many as possible automatically. Report any issues that require manual intervention.',
    icon: 'CheckCircle',
  },
  {
    key: 'write-tests',
    name: 'Write Tests',
    description: 'Generate tests for recent changes or uncovered code',
    promptTemplate:
      'Analyze the recent code changes and identify areas lacking test coverage. Write comprehensive unit and integration tests following the project testing patterns and conventions.',
    icon: 'TestTube',
  },
  {
    key: 'debug-issue',
    name: 'Debug Issue',
    description: 'Investigate a bug from a description or error log',
    promptTemplate:
      'Investigate the reported issue. Trace through the code to identify the root cause, then implement a fix. Verify the fix resolves the issue without introducing regressions.',
    icon: 'Bug',
  },
  {
    key: 'refactor',
    name: 'Refactor',
    description: 'Clean up and improve code structure in a specific area',
    promptTemplate:
      'Review the specified code area for opportunities to improve readability, reduce complexity, and follow project conventions. Refactor while maintaining existing behavior and ensuring all tests pass.',
    icon: 'RefreshCw',
  },
  {
    key: 'dependency-update',
    name: 'Dependency Update',
    description: 'Check for outdated packages and update them safely',
    promptTemplate:
      'Check for outdated dependencies in the project. Update packages to their latest compatible versions, resolve any breaking changes, and verify the project builds and tests pass after updates.',
    icon: 'Package',
  },
];
