// FILE_PATH: packages/client/src/lib/tours/hint-copy.ts

// Types
import type { HintId } from './tour-types';

/**
 * Centralised copy for every HintDot (plan §8). Kept here — separate from
 * the component — so M8's i18n seam can swap this object out without
 * touching component code.
 *
 * Earning rule (plan §8): non-obvious + high-leverage. If you're tempted to
 * add an entry, write the justification in the PR body first.
 */
export const HINT_COPY: Record<HintId, { title: string; body: string }> = {
  'run-ai-review': {
    title: 'Run an AI review',
    body: 'Spin up an automated review pass over the diff before you read it yourself. Flags risks, suggests fixes, scores the change.',
  },
  'cli-fallback': {
    title: 'Why this banner is here',
    body: "When no API provider is wired up, brainstorm and plan stages drop to CLI execution. That's why you see prose instead of structured output.",
  },
  'mcp-config': {
    title: 'MCP servers are configured here',
    body: "MCP servers extend an agent's tool surface (filesystem, git, web fetch, custom). Atlas wires up a sensible default — open this to add more or audit what's enabled.",
  },
  'dispatch-rules': {
    title: 'Auto-route work',
    body: 'Dispatch rules pick the right agent for a task by matching on path patterns. "infra/*" → ops agent, "tasks/auth/*" → security agent. Hugely powerful, easy to miss.',
  },
  'worktree-cleanup': {
    title: 'Safe to clean up',
    body: 'Removes the worktree and deletes the local branch. Your commits stay on the project branch — only the workspace shell goes away.',
  },
};
