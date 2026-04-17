// External
import { generateObject } from 'ai';

// Shared
import type { AgentProvider, BrainstormOutput, PlanOutput } from '@atlas/shared';
import { BrainstormOutputSchema, PlanOutputSchema } from '@atlas/shared';

// Lib
import { buildAiModel } from '../../lib/ai/ai-client.js';
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/workflow-runner/workflow-runner.service.ts';

export type WorkflowStageResult<T> = {
  output: T;
  inputTokens: number | undefined;
  outputTokens: number | undefined;
};

export class WorkflowRunnerService {
  /** Runs a structured brainstorm stage via the AI SDK. */
  async runBrainstorm(
    task: { name: string; description?: string | null; notes?: string | null; definitionOfDone?: string | null },
    _projectId: string,
    provider: AgentProvider,
    model?: string | null,
  ): Promise<WorkflowStageResult<BrainstormOutput>> {
    const FUNCTION_NAME = 'runBrainstorm';
    try {
      const result = await generateObject({
        model: buildAiModel(provider, model),
        schema: BrainstormOutputSchema,
        prompt: [
          'You are an expert software architect. Analyse the following task and produce a structured brainstorm.',
          '',
          `## Task: ${task.name}`,
          task.description ? `\n**Description:** ${task.description}` : '',
          task.notes ? `\n**Notes:** ${task.notes}` : '',
          task.definitionOfDone ? `\n**Definition of Done:** ${task.definitionOfDone}` : '',
          '',
          'Return multiple ideas with tradeoffs. Mark the best one as recommended.',
        ].join('\n'),
      });

      return {
        output: result.object,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to run brainstorm', { cause: error });
    }
  }

  /** Runs a structured plan stage via the AI SDK. */
  async runPlan(
    task: { name: string; description?: string | null; notes?: string | null; definitionOfDone?: string | null },
    _projectId: string,
    provider: AgentProvider,
    model?: string | null,
  ): Promise<WorkflowStageResult<PlanOutput>> {
    const FUNCTION_NAME = 'runPlan';
    try {
      const result = await generateObject({
        model: buildAiModel(provider, model),
        schema: PlanOutputSchema,
        prompt: [
          'You are an expert software engineer. Create a concrete, file-level implementation plan for the following task.',
          '',
          `## Task: ${task.name}`,
          task.description ? `\n**Description:** ${task.description}` : '',
          task.notes ? `\n**Notes:** ${task.notes}` : '',
          task.definitionOfDone ? `\n**Definition of Done:** ${task.definitionOfDone}` : '',
          '',
          'For each step, specify the file to modify, what to do, and the risk level.',
          '',
          '## Commit Plan Requirements',
          'Also produce a `commitSteps` array — an ordered list of atomic git commits the executor should make.',
          'Each commit must:',
          '- Leave the codebase in a working, non-broken state (no dangling imports, no failing existing tests)',
          '- Represent one logical concern (e.g. "add DB migration", "implement service layer", "add API route")',
          '- Have an imperative title ≤72 chars (like a good git commit message)',
          '- List the files expected to be created or modified',
          '',
          'Aim for 3–8 commits total. Fewer is better than more. Never split a single logical change across commits.',
        ].join('\n'),
      });

      return {
        output: result.object,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to run plan', { cause: error });
    }
  }
}
