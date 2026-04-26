// FILE_PATH: packages/client/src/lib/tours/definitions/skills.tour.ts

// Lib
import { selector } from '../tour-targets';

// Types
import type { TourDefinition } from '../tour-types';

/**
 * Plan §6 — `skills` (5 steps, no prerequisites).
 *
 * Skills are reusable instruction templates an agent picks up at run time.
 * Three steps of guidance, two gated by `when` for the empty-state case
 * (no skills imported yet, no card to point at).
 */
const skillsTour: TourDefinition = {
  id: 'skills',
  page: '/skills',
  title: 'Reusable skill templates',
  description: 'Build, import, and assign skills agents can pick up at run time.',
  steps: [
    {
      selector: selector('skillsNewBtn'),
      title: 'Write a skill',
      body: 'Skills are reusable instruction templates — "how to do X". Agents pick them up at run time when the work matches.',
      side: 'bottom',
      align: 'end',
    },
    {
      selector: selector('skillsImport'),
      title: 'Or import a pack',
      body: 'Pull in a community pack — caveman, parallel research, debugging — to bootstrap with proven recipes.',
      side: 'bottom',
      align: 'end',
    },
    {
      selector: selector('skillsCard'),
      title: 'Open a skill',
      body: 'Each card shows scope and type. Click to edit the steps, attach to agents, or duplicate for a variant.',
      side: 'bottom',
      align: 'start',
      // Gated: empty library should still finish gracefully on the help step.
      when: () => !!document.querySelector(selector('skillsCard')),
    },
    {
      selector: selector('helpButton'),
      title: 'Re-run anytime',
      body: 'Use Help to replay any tour or to pause them globally.',
      side: 'right',
    },
  ],
};

export default skillsTour;
