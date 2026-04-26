// FILE_PATH: packages/client/src/lib/tours/definitions/global.tour.ts

// Lib
import { selector } from '../tour-targets';

// Types
import type { TourDefinition } from '../tour-types';

/**
 * Plan §6 — `global` (4 steps, no prerequisites).
 *
 * Global config is the most-overlooked surface — most users never click
 * into it. The tour exposes the two leverage points: a system prompt that
 * applies to every agent, and dispatch rules that auto-route work.
 */
const globalTour: TourDefinition = {
  id: 'global',
  page: '/global',
  title: 'Global configuration',
  description: 'System-wide instructions and dispatch rules.',
  steps: [
    {
      selector: selector('globalInstructions'),
      title: 'System-wide instructions',
      body: "Prepended to every agent's system prompt. Use it for organisation-wide constraints — voice, security, do-not-do lists.",
      side: 'bottom',
      align: 'start',
    },
    {
      selector: selector('globalDispatchTab'),
      title: 'Dispatch rules',
      body: 'Auto-route work to a specific agent based on path patterns. "tasks/auth/*" → security agent; "infra/*" → ops agent.',
      side: 'bottom',
      align: 'start',
    },
    {
      selector: selector('helpButton'),
      title: 'Re-run anytime',
      body: 'Use Help to replay tours or pause them globally.',
      side: 'right',
    },
  ],
};

export default globalTour;
