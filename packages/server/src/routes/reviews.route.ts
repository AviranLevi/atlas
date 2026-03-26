import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateReviewSchema, UpdateReviewSchema, DecideReviewSchema, SubmitAiReviewSchema } from '@atlas/shared';
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
  .post('/:id/ai-review', zValidator('json', SubmitAiReviewSchema), submitAiReview);
