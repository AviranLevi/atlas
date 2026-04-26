// FILE_PATH: packages/client/src/lib/tours/definitions/kanban.tour.ts

// Lib
import { selector } from '../tour-targets';

// Types
import type { TourDefinition } from '../tour-types';

const ACTIVE_PROJECT_KEY = 'active-project-id';

/**
 * Plan §6 — `kanban` (5 steps, prerequisite: ≥1 active project).
 *
 * Five steps walking the user through the central work surface: the board
 * layout, creating a task, opening a card, filtering, and where live runs
 * surface. Step 3 is gated by `when` — if the board is empty the step is
 * silently skipped and the tour ends gracefully on step 4 / 5.
 *
 * Prerequisite is read from localStorage (not the React context) because
 * `prerequisites` runs outside React. The shell already routes users with
 * an active project to `/kanban`, so this is mostly belt-and-braces.
 */
const kanbanTour: TourDefinition = {
  id: 'kanban',
  page: '/kanban',
  title: 'Kanban basics',
  description: 'Columns, creating a task, dragging, running an agent.',
  prerequisites: () => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(ACTIVE_PROJECT_KEY) !== null;
  },
  steps: [
    {
      selector: selector('kanbanBoard'),
      title: 'Your board',
      body: 'Backlog → To-do → In progress → Review → Done. Drag cards between columns to update status.',
      side: 'bottom',
      align: 'start',
    },
    {
      selector: selector('kanbanAddTask'),
      title: 'Create a task',
      body: 'A title is enough to get going — assign an agent, set priority, or add a definition-of-done later.',
      side: 'bottom',
      align: 'end',
    },
    {
      selector: selector('kanbanTaskCard'),
      title: 'Open a card',
      body: 'Click to edit. The play icon kicks off a workspace and runs the assigned agent.',
      side: 'right',
      // Empty board? Skip silently — the tour ends on step 4 / 5.
      when: () => !!document.querySelector(selector('kanbanTaskCard')),
    },
    {
      selector: selector('kanbanFilterBar'),
      title: 'Filter the board',
      body: 'Slim the view to one agent or clear filters to see everything.',
      side: 'bottom',
      align: 'end',
    },
    {
      selector: selector('navWorkspaces'),
      title: 'Watch progress',
      body: 'Live agent runs show up under Workspaces — open it any time to follow along or cancel a run.',
      side: 'right',
    },
  ],
};

export default kanbanTour;
