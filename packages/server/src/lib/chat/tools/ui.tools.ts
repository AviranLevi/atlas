// External
import { z } from 'zod';

// Lib
import { buildConfirmCard, buildPlanCard, makeUICardResult } from '../../chat-ui/index.js';
import { makeChatTool } from './registry.js';

const PLAN_STEP_SCHEMA = z.object({
  step: z.string().describe('Short step label'),
  detail: z.string().optional().describe('Optional elaboration shown below the label'),
  done: z.boolean().optional().describe('Mark as completed (shows a checkmark)'),
});

const CONFIRM_CHOICE_SCHEMA = z.object({
  label: z.string().describe('Button label'),
  value: z.string().describe('Message sent when this button is clicked'),
  style: z.enum(['primary', 'secondary', 'danger']).optional().describe('Button visual style'),
  icon: z
    .enum(['agent', 'task', 'pipeline', 'cancel', 'check'])
    .optional()
    .describe('Optional icon shown before the label — use "agent" when listing agents'),
});

export const presentPlanTool = makeChatTool({
  name: 'present_plan',
  description:
    'Display a structured, numbered plan as a rich visual card in the chat. ' +
    'Use this whenever you have a multi-step plan to show — it renders as an interactive card ' +
    'instead of plain text, making it much easier to read. Call this BEFORE executing the plan.',
  mutating: false,
  inputSchema: z.object({
    title: z.string().describe('Plan title (e.g. "Refactor auth module")'),
    steps: z.array(PLAN_STEP_SCHEMA).min(1).describe('Ordered list of steps'),
    subtitle: z.string().optional().describe('Optional subtitle / context line'),
  }),
  handler: async (input) => {
    const html = buildPlanCard(input);
    return makeUICardResult(html, { title: input.title, steps: input.steps });
  },
});

export const confirmActionTool = makeChatTool({
  name: 'confirm_action',
  description:
    'Show a confirmation card with clickable choices. Use when you need the user to pick ' +
    'between options before you proceed — e.g. "Create 3 tasks?" with Yes / Cancel buttons. ' +
    'The user clicks a button and their choice is sent back as a chat message.',
  mutating: false,
  inputSchema: z.object({
    question: z.string().describe('The question or action requiring confirmation'),
    detail: z.string().optional().describe('Optional extra context shown below the question'),
    choices: z.array(CONFIRM_CHOICE_SCHEMA).min(2).describe('Available choices (2–4 recommended)'),
  }),
  handler: async (input) => {
    const html = buildConfirmCard(input);
    return makeUICardResult(html, { question: input.question, choices: input.choices });
  },
});

export const uiTools = [presentPlanTool, confirmActionTool];
