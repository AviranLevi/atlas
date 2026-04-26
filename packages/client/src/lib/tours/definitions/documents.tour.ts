// FILE_PATH: packages/client/src/lib/tours/definitions/documents.tour.ts

// Lib
import { selector } from '../tour-targets';

// Types
import type { TourDefinition } from '../tour-types';

const ACTIVE_PROJECT_KEY = 'active-project-id';

/**
 * Plan §6 — `documents` (3 steps, prerequisite: ≥1 active project).
 *
 * The auto-generated section and the AI types are the non-obvious bit:
 * users tend to assume "documents" means "manual markdown" and miss the
 * one-click architecture / db-schema / api-diagram generators. This tour
 * leads with that, then surfaces the custom-doc escape hatch.
 *
 * Both anchors live inside the project-mode sidebar — when no project is
 * active the page renders `AllProjectsView` and the targets aren't on the
 * DOM, so the prerequisites check guards us.
 */
const documentsTour: TourDefinition = {
  id: 'documents',
  page: '/documents',
  title: 'Generate and write docs',
  description: 'Auto-generate diagrams from code or hand-author a custom doc.',
  prerequisites: () => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(ACTIVE_PROJECT_KEY) !== null;
  },
  steps: [
    {
      selector: selector('documentsAiTypes'),
      title: 'Auto-generated diagrams',
      body: 'Architecture, DB schema, API graph — generated from your code on demand. Click a type to preview, generate, or regenerate.',
      side: 'right',
      align: 'start',
    },
    {
      selector: selector('documentsCustomDoc'),
      title: 'Hand-authored docs',
      body: 'Write anything else — onboarding notes, decision logs, runbooks. Custom docs sit alongside the auto-generated ones.',
      side: 'right',
    },
    {
      selector: selector('helpButton'),
      title: 'Re-run anytime',
      body: 'Use Help to replay tours or pause them globally.',
      side: 'right',
    },
  ],
};

export default documentsTour;
