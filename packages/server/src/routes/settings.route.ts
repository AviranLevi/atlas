import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  CreateGlobalInstructionsSchema,
  UpdateGlobalInstructionsSchema,
  CreateDispatchRuleSchema,
  UpdateDispatchRuleSchema,
} from '@my-agents/shared';
import { settingsService } from '../services/index.js';

const globalInstructionsRoute = new Hono()
  .get('/', async (c) => {
    const items = await settingsService.listGlobalInstructions();
    return c.json(items);
  })
  .get('/:id', async (c) => {
    const item = await settingsService.getGlobalInstructionsById(
      c.req.param('id')
    );
    return c.json(item);
  })
  .post(
    '/',
    zValidator('json', CreateGlobalInstructionsSchema),
    async (c) => {
      const data = c.req.valid('json');
      const item = await settingsService.createGlobalInstructions(data);
      return c.json(item, 201);
    }
  )
  .put(
    '/:id',
    zValidator('json', UpdateGlobalInstructionsSchema),
    async (c) => {
      const item = await settingsService.updateGlobalInstructions(
        c.req.param('id'),
        c.req.valid('json')
      );
      return c.json(item);
    }
  )
  .delete('/:id', async (c) => {
    await settingsService.deleteGlobalInstructions(c.req.param('id'));
    return c.body(null, 204);
  });

const dispatchRulesRoute = new Hono()
  .get('/', async (c) => {
    const items = await settingsService.listDispatchRules();
    return c.json(items);
  })
  .get('/:id', async (c) => {
    const item = await settingsService.getDispatchRuleById(c.req.param('id'));
    return c.json(item);
  })
  .post('/', zValidator('json', CreateDispatchRuleSchema), async (c) => {
    const data = c.req.valid('json');
    const item = await settingsService.createDispatchRule(data);
    return c.json(item, 201);
  })
  .put(
    '/:id',
    zValidator('json', UpdateDispatchRuleSchema),
    async (c) => {
      const item = await settingsService.updateDispatchRule(
        c.req.param('id'),
        c.req.valid('json')
      );
      return c.json(item);
    }
  )
  .delete('/:id', async (c) => {
    await settingsService.deleteDispatchRule(c.req.param('id'));
    return c.body(null, 204);
  });

export const settingsRoute = new Hono()
  .route('/global-instructions', globalInstructionsRoute)
  .route('/dispatch-rules', dispatchRulesRoute);
