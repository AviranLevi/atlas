import { z } from 'zod';

export const PlanStepSchema = z.object({
  order: z.number().int(),
  title: z.string(),
  file: z.string().nullable(),
  description: z.string(),
  risk: z.enum(['low', 'medium', 'high']),
});

export const CommitStepSchema = z.object({
  step: z.number().int(),
  title: z.string(),
  description: z.string(),
  files: z.array(z.string()),
});

export const PlanOutputSchema = z.object({
  summary: z.string(),
  estimatedComplexity: z.enum(['low', 'medium', 'high']),
  steps: z.array(PlanStepSchema),
  commitSteps: z.array(CommitStepSchema).optional().default([]),
  concerns: z.array(z.string()),
});

export const BrainstormIdeaSchema = z.object({
  title: z.string(),
  description: z.string(),
  tradeoffs: z.array(z.string()),
  recommended: z.boolean(),
});

export const BrainstormOutputSchema = z.object({
  overview: z.string(),
  ideas: z.array(BrainstormIdeaSchema),
  recommendation: z.string(),
});

export const WorkflowOutputSchema = z.discriminatedUnion('stage', [
  z.object({ stage: z.literal('plan'), data: PlanOutputSchema }),
  z.object({ stage: z.literal('brainstorm'), data: BrainstormOutputSchema }),
]);

export type PlanStep = z.infer<typeof PlanStepSchema>;
export type CommitStep = z.infer<typeof CommitStepSchema>;
export type PlanOutput = z.infer<typeof PlanOutputSchema>;
export type BrainstormIdea = z.infer<typeof BrainstormIdeaSchema>;
export type BrainstormOutput = z.infer<typeof BrainstormOutputSchema>;
export type WorkflowOutput = z.infer<typeof WorkflowOutputSchema>;
