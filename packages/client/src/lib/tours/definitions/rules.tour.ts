// FILE_PATH: packages/client/src/lib/tours/definitions/rules.tour.ts

// Lib
import { selector } from '../tour-targets';

// Types
import type { TourDefinition } from '../tour-types';

/**
 * Plan §6 — `rules` (4 steps, no prerequisites).
 *
 * Rules are coding standards / conventions agents must follow. The two
 * non-obvious surfaces are templates (don't write from scratch) and
 * scoping (project vs global).
 */
const rulesTour: TourDefinition = {
  id: 'rules',
  page: '/rules',
  title: 'Coding standards for agents',
  description: 'Templates, custom rules, and how scoping works.',
  steps: [
    {
      selector: selector('rulesTemplates'),
      title: 'Start from a template',
      body: 'A library of well-known conventions — TypeScript style, React patterns, security baselines. Pick one, customise, save.',
      side: 'bottom',
      align: 'end',
    },
    {
      selector: selector('rulesNewBtn'),
      title: 'Or write your own',
      body: 'Anything that\'s "always do X" or "never Y" belongs here. Agents pick rules up automatically when they apply.',
      side: 'bottom',
      align: 'end',
    },
    {
      selector: selector('helpButton'),
      title: 'Re-run anytime',
      body: 'Use Help to replay tours or pause them globally.',
      side: 'right',
    },
  ],
};

export default rulesTour;
