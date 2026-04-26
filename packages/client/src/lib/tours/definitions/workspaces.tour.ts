// FILE_PATH: packages/client/src/lib/tours/definitions/workspaces.tour.ts

// Lib
import { selector } from '../tour-targets';

// Types
import type { TourDefinition } from '../tour-types';

const ACTIVE_PROJECT_KEY = 'active-project-id';

/**
 * Plan §6 — `workspaces` (4 steps, prerequisite: ≥1 active project).
 *
 * Walks the user through the runs list: stat overview, status filtering,
 * what a row represents, and where to come back for help. Row step is
 * gated by `when` — first-time visitors with zero workspaces still get a
 * coherent tour that ends on the help step.
 */
const workspacesTour: TourDefinition = {
  id: 'workspaces',
  page: '/workspaces',
  title: 'Track agent runs',
  description: 'Stats, filters, and the run list — everything an agent has touched.',
  prerequisites: () => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(ACTIVE_PROJECT_KEY) !== null;
  },
  steps: [
    {
      selector: selector('workspacesStats'),
      title: 'Health at a glance',
      body: 'Counts of active, awaiting approval, needs review, merged, and failed runs. Spot stuck work fast.',
      side: 'bottom',
      align: 'start',
    },
    {
      selector: selector('workspacesStatusTabs'),
      title: 'Slice by status',
      body: 'Jump straight to runs that need your attention — review queue, awaiting approval, or anything failed.',
      side: 'bottom',
      align: 'start',
    },
    {
      selector: selector('workspacesRow'),
      title: 'Each row is a run',
      body: 'Open it to follow live logs, review the diff, run AI review, or clean up the worktree when done.',
      side: 'bottom',
      align: 'start',
      // Skipped silently if no workspaces have run yet.
      when: () => !!document.querySelector(selector('workspacesRow')),
    },
    {
      selector: selector('helpButton'),
      title: 'Re-run anytime',
      body: 'Use Help to replay any tour or to pause them globally.',
      side: 'right',
    },
  ],
};

export default workspacesTour;
