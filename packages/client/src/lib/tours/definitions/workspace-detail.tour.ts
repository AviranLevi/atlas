// FILE_PATH: packages/client/src/lib/tours/definitions/workspace-detail.tour.ts

// Lib
import { selector } from '../tour-targets';

// Types
import type { TourDefinition } from '../tour-types';

/**
 * Plan §6 — `workspace-detail` (5 steps, prerequisite: workspace exists).
 *
 * Richest surface in the app: status header, CLI fallback diagnostics,
 * AI review trigger, follow-up task, cleanup. Steps 2–5 are all gated
 * by `when` because what's on screen depends heavily on workspace state
 * (running vs done vs failed, fallback fired or not, review pending).
 *
 * Page key matches the pattern Plan §6 uses — `usePageTour` route-matches
 * `/workspaces/:id` against this prefix when picking the active tour.
 */
const workspaceDetailTour: TourDefinition = {
  id: 'workspace-detail',
  page: '/workspaces/:id',
  title: 'Inside a workspace',
  description: 'Header status, AI review, follow-ups, and cleanup.',
  steps: [
    {
      selector: selector('workspaceHeader'),
      title: 'Status at a glance',
      body: 'Task name, current state, and every action you can take from here. The chip on the left shows the live status.',
      side: 'bottom',
      align: 'start',
    },
    {
      selector: selector('workspaceCliBanner'),
      title: 'Why CLI fallback fires',
      body: 'When no API provider is wired up, brainstorm and plan stages drop to CLI execution and produce prose instead of structured output.',
      side: 'bottom',
      // Banner only renders when fallback actually happened.
      when: () => !!document.querySelector(selector('workspaceCliBanner')),
    },
    {
      selector: selector('workspaceRunReview'),
      title: 'Run an AI review',
      body: 'Spin up an automated review pass over the diff before you read it yourself — flags risks, suggests fixes, scores the change.',
      side: 'bottom',
      align: 'end',
      when: () => !!document.querySelector(selector('workspaceRunReview')),
    },
    {
      selector: selector('workspaceFollowUp'),
      title: 'Spawn a follow-up',
      body: 'Continue this work in a new workspace with the diff carried over — perfect for "fix the review notes" or "extend this".',
      side: 'bottom',
      align: 'end',
      when: () => !!document.querySelector(selector('workspaceFollowUp')),
    },
    {
      selector: selector('workspaceCleanup'),
      title: 'Done? Clean up',
      body: 'Removes the worktree and deletes the local branch. Your commits stay on the project branch — only the workspace shell goes away.',
      side: 'bottom',
      align: 'end',
      when: () => !!document.querySelector(selector('workspaceCleanup')),
    },
  ],
};

export default workspaceDetailTour;
