// External
import type { Context } from 'hono';

// Shared
import type { CreateReview, UpdateReview, DecideReview } from '@my-agents/shared';

// Services
import { reviewsService } from '../services/index.js';

/** Returns the review for a task. Requires taskId query param. */
export async function listReviews(c: Context) {
  const taskId = c.req.query('taskId');
  if (!taskId) {
    return c.json({ error: 'taskId query param is required' }, 400);
  }
  const review = await reviewsService.getByTask(taskId);
  return c.json(review);
}

/** Returns a review by ID. */
export async function getReview(c: Context) {
  const review = await reviewsService.getById(c.req.param('id')!);
  return c.json(review);
}

/** Creates a review for a task. */
export async function createReview(c: Context) {
  const { taskId } = (c.req as any).valid('json') as CreateReview;
  const review = await reviewsService.createForTask(taskId);
  return c.json(review, 201);
}

/** Updates a review by ID. */
export async function updateReview(c: Context) {
  const review = await reviewsService.update(c.req.param('id')!, (c.req as any).valid('json') as UpdateReview);
  return c.json(review);
}

/** Records a human decision (approved/changes_requested) on a review. */
export async function decideReview(c: Context) {
  const { decision, notes } = (c.req as any).valid('json') as DecideReview;
  const review = await reviewsService.decide(c.req.param('id')!, decision, notes);
  return c.json(review);
}

/** Submits an AI agent's review decision with optional checklist updates. */
export async function submitAiReview(c: Context) {
  const data = (c.req as any).valid('json') as {
    agentId: string;
    decision: 'approved' | 'changes_requested';
    notes?: string | null;
    checklistUpdates?: { item: string; checked: boolean }[];
  };
  const review = await reviewsService.submitAiReview(c.req.param('id')!, data);
  return c.json(review);
}
