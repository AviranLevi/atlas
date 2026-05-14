/**
 * LLM prompt templates emitted by chat-UI card action buttons.
 * Kept separate from chat-ui.constants.ts so prompt engineering
 * stays decoupled from rendering / styling concerns.
 */

/** Prompt for the "Create Tasks" button on a plan card — one task per step. */
export function createTasksPrompt(planTitle: string): string {
  return (
    `[EXECUTE] Create individual tasks from the plan "${planTitle}". ` +
    'Call create_task for each step now. Use the exact step names and details. ' +
    'Do NOT call present_plan — just create the tasks directly.'
  );
}

/** Prompt for the "Create as Pipeline" button — phased grouping with dependencies. */
export function createPipelinePrompt(planTitle: string, _stepCount: number): string {
  return (
    `[EXECUTE] Create a pipeline named "${planTitle}" using the create_pipeline tool now. ` +
    'Use the exact step names and details from the plan as pipeline tasks. ' +
    'Do NOT call present_plan — just call create_pipeline directly.'
  );
}
