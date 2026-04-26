// FILE_PATH: packages/client/src/lib/tours/definitions/projects-dashboard.tour.ts

// Lib
import { selector } from '../tour-targets';

// Types
import type { TourDefinition } from '../tour-types';

/**
 * Plan §6 — `projects-dashboard` (4 steps, no prerequisites).
 *
 * First content most users see in shell mode B (`noActiveProject`). Goal:
 * orient them to the dashboard fast — what's a project, how to make one,
 * how to find one, where to come back for help.
 */
const projectsDashboardTour: TourDefinition = {
  id: 'projects-dashboard',
  page: '/projects',
  title: 'Get oriented on projects',
  description: 'Tour the dashboard — create, find, and open projects.',
  steps: [
    {
      selector: selector('projectsNewBtn'),
      title: 'Start with a project',
      body: 'Every Atlas workflow hangs off a project. Spin one up to anchor your tasks, agents, and memory.',
      side: 'bottom',
      align: 'end',
    },
    {
      selector: selector('projectsFilter'),
      title: 'Find what you need',
      body: 'Once you have a few projects, search by name, path, or tech — and filter by status.',
      side: 'bottom',
      align: 'start',
    },
    {
      selector: selector('projectsCard'),
      title: 'Open a project',
      body: 'Each card shows status, branch, and progress. Click to dive in.',
      side: 'bottom',
      // Skipped silently when no cards are on screen yet (state B with zero projects).
      when: () => !!document.querySelector(selector('projectsCard')),
    },
    {
      selector: selector('helpButton'),
      title: 'Re-run anytime',
      body: 'Need this again? The Help button replays any tour or pauses them globally.',
      side: 'right',
    },
  ],
};

export default projectsDashboardTour;
