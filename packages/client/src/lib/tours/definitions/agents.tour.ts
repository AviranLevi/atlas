// FILE_PATH: packages/client/src/lib/tours/definitions/agents.tour.ts

// Lib
import { selector } from '../tour-targets';

// Types
import type { TourDefinition } from '../tour-types';

/**
 * Plan §6 — `agents` (5 steps, no prerequisites).
 *
 * The agents page has two stacked sections (Providers + Agents). The tour
 * walks them in dependency order — providers first, then agents — and ends
 * by pointing at Import + the Help button so users know where to go for
 * pre-built configs and to re-run the tour later.
 */
const agentsTour: TourDefinition = {
  id: 'agents',
  page: '/agents',
  title: 'Set up agents',
  description: 'Wire up a model, build an agent, or import one from the community.',
  steps: [
    {
      selector: selector('agentsProviders'),
      title: 'Step 1 — pick a model',
      body: 'A provider is the wire to a model: an API key (Anthropic, OpenAI, OpenRouter, …) or a local CLI agent like Claude Code.',
      side: 'bottom',
      align: 'start',
    },
    {
      selector: selector('agentsAddProvider'),
      title: 'Add your first provider',
      body: 'Most users start by pasting an API key here. CLI agents can also be wired up — Atlas detects them automatically.',
      side: 'left',
    },
    {
      selector: selector('agentsNewAgent'),
      title: 'Step 2 — build an agent',
      body: 'An agent = a system prompt + a model. Keep them small, named for the role they play (e.g. "Reviewer", "Implementer").',
      side: 'left',
    },
    {
      selector: selector('agentsImport'),
      title: 'Or import a package',
      body: 'Pre-built agents from the community shortcut the design step. Browse and pick — then customise as needed.',
      side: 'bottom',
      align: 'end',
    },
    {
      selector: selector('helpButton'),
      title: 'Stuck or want this again?',
      body: 'The Help button replays any tour and pauses them all if you want quiet. Settings → Onboarding has the same controls.',
      side: 'right',
    },
  ],
};

export default agentsTour;
