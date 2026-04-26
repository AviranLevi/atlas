// External
import { Hono } from 'hono';

// Shared
import { CreateReviewSchema, DecideReviewSchema, SubmitAiReviewSchema, UpdateReviewSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  createReview,
  decideReview,
  getReview,
  listReviews,
  submitAiReview,
  updateReview,
} from '../controllers/reviews.controller.js';

export const reviewsRoute = new Hono()
  .get('/', listReviews)
  .get('/:id', getReview)
  .post('/', zValidator('json', CreateReviewSchema), createReview)
  .put('/:id', zValidator('json', UpdateReviewSchema), updateReview)
  .post('/:id/decide', zValidator('json', DecideReviewSchema), decideReview)
  .post('/:id/ai-review', zValidator('json', SubmitAiReviewSchema), submitAiReview);
