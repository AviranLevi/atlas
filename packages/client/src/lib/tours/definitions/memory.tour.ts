// FILE_PATH: packages/client/src/lib/tours/definitions/memory.tour.ts

// Lib
import { selector } from '../tour-targets';

// Types
import type { TourDefinition } from '../tour-types';

/**
 * Plan §6 — `memory` (3 steps, no prerequisites).
 *
 * Tight tour: most users get to memory after agents have already written
 * a few entries, so the goal is to demystify what the surface is and how
 * to filter / prune.
 */
const memoryTour: TourDefinition = {
  id: 'memory',
  page: '/memory',
  title: 'Memories that stick',
  description: 'Decisions, conventions, and preferences agents recall across sessions.',
  steps: [
    {
      selector: selector('memoryNewBtn'),
      title: 'Write a memory',
      body: 'Agents add these automatically as they work. You can also pin a decision or convention by hand here.',
      side: 'bottom',
      align: 'end',
    },
    {
      selector: selector('memoryStatusFilter'),
      title: 'Active or archived',
      body: 'Filter to active to focus on what agents will currently use; archived keeps history without polluting recall.',
      side: 'bottom',
      align: 'end',
    },
    {
      selector: selector('helpButton'),
      title: 'Re-run anytime',
      body: 'Help replays any tour or pauses them globally if you want a quieter UI.',
      side: 'right',
    },
  ],
};

export default memoryTour;
