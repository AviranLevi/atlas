/**
 * Static copy and helpers for the design-context generation user prompt.
 * Dynamic project facts are assembled in `DesignContextGeneratorService.buildPromptProjectSection`.
 */

/** Opening instructions and `## Project` heading (facts follow from the service). */
export const DESIGN_CONTEXT_PROMPT_PREAMBLE_LINES: readonly string[] = [
  'You are a design system analyst. Analyze the following project context and produce a structured DESIGN.md file.',
  '',
  'The DESIGN.md will be injected into AI agent prompts so agents can build UI that is visually consistent with the codebase.',
  'Be specific and accurate — only describe what you can infer from the provided data. Do not invent values.',
  '',
  '---',
  '',
  '## Project',
];

/** Rubric after optional source file blocks: required sections and output format. */
export const DESIGN_CONTEXT_PROMPT_TASK_LINES: readonly string[] = [
  '',
  '---',
  '',
  '## Your Task',
  '',
  'Produce a DESIGN.md for this project. Structure it with these sections (include only what you can infer):',
  '',
  '1. **Visual Theme** — style, tone, dark/light mode support',
  '2. **Color Palette** — all color tokens with their values',
  '3. **Typography** — font families, size scale, weights',
  '4. **Spacing & Sizing** — border radius tokens, common gap values, fixed dimensions',
  '5. **Components** — visual spec for key components (Button, Card, Input, Badge, Dialog, etc.)',
  '6. **Animations & Transitions** — if present',
  '7. **Theming Notes for AI Agents** — practical rules an agent must follow when building UI',
  '',
  'Format as clean markdown. Be concise and developer-focused.',
  'Start your response directly with the `# <ProjectName> Design System` heading — no preamble.',
];

/** One fenced block for an on-disk design file (CSS / Tailwind config). */
export function designContextSourceFilePromptLines(filename: string, content: string): string[] {
  return ['', `## Source: \`${filename}\``, '', '```', content, '```'];
}
