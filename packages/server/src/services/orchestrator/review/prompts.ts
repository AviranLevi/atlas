// Shared
import type { ChecklistItem } from '@atlas/shared';

/** Inline diff comment shape consumed by `buildRequestChangesPrompt`. */
export type DiffCommentForPrompt = {
  filename: string;
  lineNumber: number;
  lineContent: string;
  body: string;
};

/**
 * Tail section for a request-changes re-run. The caller appends this to the
 * existing task/project prompt built by `buildPrompt`.
 */
export function buildRequestChangesPrompt(basePrompt: string, comments: DiffCommentForPrompt[]): string {
  const commentLines = comments.map((c) => {
    return `- **${c.filename}** (line ${c.lineNumber}): "${c.body}"${c.lineContent ? `\n  Code: \`${c.lineContent}\`` : ''}`;
  });

  const reviewSection = [
    '',
    '---',
    '',
    '## Review Comments — Changes Requested',
    '',
    'The reviewer has left the following comments on your code. Please address each one:',
    '',
    ...commentLines,
    '',
    'Please fix each issue above, then commit your changes to the current branch.',
  ].join('\n');

  return basePrompt + reviewSection;
}

/**
 * Standalone prompt for the AI reviewer agent. Does NOT compose with
 * `buildPrompt` — the reviewer's job is to look at the diff, not to
 * re-implement the task, so it gets a different context shape.
 */
export function buildReviewerPrompt(params: {
  taskName: string;
  taskNotes: string | null;
  checklist: ChecklistItem[];
  diffText: string;
  autoFix: boolean;
  reviewId: string | undefined;
}): string {
  const { taskName, taskNotes, checklist, diffText, autoFix, reviewId } = params;

  const checklistText =
    checklist.length > 0
      ? checklist.map((c: ChecklistItem) => `- [${c.checked ? 'x' : ' '}] ${c.item}`).join('\n')
      : '(no checklist items defined)';

  return [
    `# Code Review Task`,
    ``,
    `You are a code reviewer. Your job is to review the code changes below against the task requirements and definition of done.`,
    ``,
    `## Task: ${taskName}`,
    taskNotes ? `\n**Notes:**\n${taskNotes}` : '',
    ``,
    `## Definition of Done`,
    checklistText,
    ``,
    `## Code Changes`,
    diffText,
    ``,
    `## Instructions`,
    `Review the diff carefully. For each definition of done item, determine whether the code satisfies it.`,
    autoFix
      ? [
          `If all requirements are met, call \`submit_review\` with decision "approved".`,
          `If any requirements are NOT met, fix the issues directly in the code, commit your changes, then call \`submit_review\` with decision "approved" and notes describing what you fixed.`,
          `Only use "changes_requested" if you are unable to fix an issue yourself.`,
        ].join('\n')
      : [
          `Then call the \`submit_review\` MCP tool with:`,
          `- decision: "approved" if all requirements are met, or "changes_requested" if any are missing`,
          `- notes: a brief summary of your findings`,
          `- checklistUpdates: an array marking each item as checked/unchecked based on what the diff implements`,
        ].join('\n'),
    ``,
    `The reviewId is: "${reviewId ?? 'unknown'}"`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Tail section for `applyReviewFix`. Appends reviewer feedback + unchecked
 * DoD items to the base task/project prompt.
 */
export function buildApplyFixPrompt(
  basePrompt: string,
  reviewNotes: string | null,
  uncheckedItems: ChecklistItem[],
): string {
  const checklistSection =
    uncheckedItems.length > 0
      ? uncheckedItems.map((c: ChecklistItem) => `- [ ] ${c.item}`).join('\n')
      : '(no unchecked checklist items)';

  const fixSection = [
    '',
    '---',
    '',
    '## Reviewer Feedback — Changes Requested',
    '',
    'The AI reviewer has requested changes on this task. Apply every fix described below, commit each change, then stop — we will re-run the review afterward.',
    '',
    '### Reviewer Notes',
    '',
    reviewNotes?.trim() ? reviewNotes : '(no notes)',
    '',
    '### Outstanding Definition of Done',
    '',
    checklistSection,
  ].join('\n');

  return basePrompt + fixSection;
}
