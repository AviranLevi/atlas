// External
import { Hono } from 'hono';

// Shared
import { CreateRuleSchema, UpdateRuleSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  createRule,
  deleteRule,
  getRule,
  getRuleDetail,
  listRules,
  updateRule,
} from '../controllers/rules.controller.js';

export const rulesRoute = new Hono()
  .get('/', listRules)
  .get('/:id/detail', getRuleDetail)
  .get('/:id', getRule)
  .post('/', zValidator('json', CreateRuleSchema), createRule)
  .put('/:id', zValidator('json', UpdateRuleSchema), updateRule)
  .delete('/:id', deleteRule);
