// FILE_PATH: packages/client/src/lib/tours/definitions/chat.tour.ts

// Lib
import { selector } from '../tour-targets';

// Types
import type { TourDefinition } from '../tour-types';

/**
 * Plan §6 — `chat` (4 steps, no prerequisites).
 *
 * Ambient chat surface. Goal: surface the two non-obvious things —
 * (1) you can switch between API and CLI backends, (2) you can @-mention
 * agents inline — and orient the user to the conversation list.
 *
 * The backend toggle step is gated: it only renders when both API and CLI
 * options are available. On users with only one backend the tour drops
 * to 3 steps gracefully.
 */
const chatTour: TourDefinition = {
  id: 'chat',
  page: '/chat',
  title: 'Chat with your stack',
  description: 'Pick a backend, choose a model, and @-mention agents.',
  steps: [
    {
      selector: selector('chatSidebar'),
      title: 'Conversations live here',
      body: 'Search past chats, start new ones, and resume anything. Conversations stick to the active project.',
      side: 'right',
      align: 'start',
    },
    {
      selector: selector('chatBackendSwitch'),
      title: 'API or CLI',
      body: 'Toggle between an API provider (fast, cost-tracked) and a CLI agent like Claude Code. Same interface, different runtime.',
      side: 'top',
      // Only visible when both options are configured.
      when: () => !!document.querySelector(selector('chatBackendSwitch')),
    },
    {
      selector: selector('chatProviderSelect'),
      title: 'Pick a provider and model',
      body: 'Each conversation locks in its provider/model when the first message is sent — switch here before you start.',
      side: 'top',
      align: 'start',
    },
    {
      selector: selector('chatInput'),
      title: 'Send a message',
      body: 'Type to chat, attach files, or @-mention an agent to route the question through their system prompt and tools.',
      side: 'top',
    },
  ],
};

export default chatTour;
