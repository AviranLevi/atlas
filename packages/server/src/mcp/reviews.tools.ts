import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ReviewDecisionEnum, ChecklistItemSchema } from '@atlas/shared';
import { reviewsService } from '../services/index.js';

export function registerReviewTools(server: McpServer): void {
  server.registerTool('get_review', {
    description: 'Get the review for a task including checklist and current status',
    inputSchema: z.object({
      taskId: z.string().uuid().describe('The task UUID'),
    }),
  }, async ({ taskId }) => {
    const review = await reviewsService.getByTask(taskId);
    return { content: [{ type: 'text' as const, text: JSON.stringify(review, null, 2) }] };
  });

  server.registerTool('submit_review', {
    description:
      'Submit a review decision for a task. Use this when you have reviewed the code changes and are ready to approve or request changes.',
    inputSchema: z.object({
      reviewId: z.string().uuid().describe('The review UUID'),
      decision: ReviewDecisionEnum.describe('The review decision'),
      notes: z.string().optional().describe('Review feedback or notes for the developer'),
      checklistUpdates: z
        .array(ChecklistItemSchema)
        .optional()
        .describe('Update checklist item completion status'),
    }),
  }, async ({ reviewId, decision, notes, checklistUpdates }) => {
    const review = await reviewsService.submitAiReview(reviewId, {
      decision,
      notes: notes ?? null,
      checklistUpdates,
    });
    return { content: [{ type: 'text' as const, text: JSON.stringify(review, null, 2) }] };
  });
}
