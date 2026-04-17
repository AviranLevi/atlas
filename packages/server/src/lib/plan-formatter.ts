// Shared
import type { PlanOutput } from '@atlas/shared';

/** Formats a PlanOutput as a Markdown string for the specs/atlas-plan.md file. */
export function formatPlanAsMarkdown(plan: PlanOutput): string {
  const lines: string[] = [
    '# Atlas Implementation Plan',
    '',
    `**Complexity:** ${plan.estimatedComplexity}`,
    '',
    '## Summary',
    '',
    plan.summary,
    '',
    '## Steps',
    '',
  ];

  for (const step of plan.steps) {
    lines.push(`### ${step.order}. ${step.title}`);
    if (step.file) lines.push(`**File:** \`${step.file}\``);
    lines.push(`**Risk:** ${step.risk}`);
    lines.push('');
    lines.push(step.description);
    lines.push('');
  }

  if (plan.concerns.length > 0) {
    lines.push('## Concerns');
    lines.push('');
    for (const concern of plan.concerns) {
      lines.push(`- ${concern}`);
    }
    lines.push('');
  }

  if (plan.commitSteps && plan.commitSteps.length > 0) {
    lines.push('## Commit Plan');
    lines.push('');
    lines.push('Follow these atomic commits in order. Each commit must leave the repo in a working state.');
    lines.push('');
    for (const cs of plan.commitSteps) {
      lines.push(`### Commit ${cs.step}: ${cs.title}`);
      lines.push('');
      lines.push(cs.description);
      lines.push('');
      lines.push(`**Files:** ${cs.files.map((f) => `\`${f}\``).join(', ')}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}
