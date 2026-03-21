import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  DecideReviewSchema,
} from '@my-agents/shared';
import { reviewsService } from '../services/index.js';

export const reviewsRoute = new Hono()
  .get('/', async (c) => {
    const taskId = c.req.query('taskId');
    if (!taskId) {
      return c.json({ error: 'taskId query param is required' }, 400);
    }
    const review = await reviewsService.getByTask(taskId);
    return c.json(review);
  })
  .get('/:id', async (c) => {
    const review = await reviewsService.getById(c.req.param('id'));
    return c.json(review);
  })
  .post('/', zValidator('json', CreateReviewSchema), async (c) => {
    const { taskId } = c.req.valid('json');
    const review = await reviewsService.createForTask(taskId);
    return c.json(review, 201);
  })
  .put('/:id', zValidator('json', UpdateReviewSchema), async (c) => {
    const review = await reviewsService.update(c.req.param('id'), c.req.valid('json'));
    return c.json(review);
  })
  .post('/:id/decide', zValidator('json', DecideReviewSchema), async (c) => {
    const { decision, notes } = c.req.valid('json');
    const review = await reviewsService.decide(c.req.param('id'), decision, notes);
    return c.json(review);
  })
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
    async (c) => {
      const data = c.req.valid('json');
      const review = await reviewsService.submitAiReview(c.req.param('id'), data);
      return c.json(review);
    }
  );
