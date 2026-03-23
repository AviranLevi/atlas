// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// Shared
import { CreateReviewSchema, UpdateReviewSchema, DecideReviewSchema } from '@my-agents/shared';

// Controllers
import {
  listReviews,
  getReview,
  createReview,
  updateReview,
  decideReview,
  submitAiReview,
} from '../controllers/reviews.controller.js';

export const reviewsRoute = new Hono()
  .get('/', listReviews)
  .get('/:id', getReview)
  .post('/', zValidator('json', CreateReviewSchema), createReview)
  .put('/:id', zValidator('json', UpdateReviewSchema), updateReview)
  .post('/:id/decide', zValidator('json', DecideReviewSchema), decideReview)
  .post(
    '/:id/ai-review',
    zValidator(
      'json',
      z.object({
        agentId: z.string().uuid(),
        decision: z.enum(['approved', 'changes_requested']),
        notes: z.string().nullable().optional(),
        checklistUpdates: z.array(z.object({ item: z.string(), checked: z.boolean() })).optional(),
      })
    ),
    submitAiReview
  );
