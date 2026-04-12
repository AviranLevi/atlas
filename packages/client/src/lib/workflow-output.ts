// Shared
import type { WorkflowOutput } from '@atlas/shared';
import { WorkflowOutputSchema } from '@atlas/shared';

/** Attempts to parse a workspace output string as a WorkflowOutput. Returns null if not valid JSON or wrong shape. */
export function tryParseWorkflowOutput(output: string | null | undefined): WorkflowOutput | null {
  if (!output) return null;
  try {
    return WorkflowOutputSchema.parse(JSON.parse(output));
  } catch {
    return null;
  }
}
