// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { CreateRuleSchema, UpdateRuleSchema } from '@my-agents/shared';

// Controllers
import { listRules, getRule, getRuleDetail, createRule, updateRule, deleteRule } from '../controllers/rules.controller.js';

export const rulesRoute = new Hono()
  .get('/', listRules)
  .get('/:id/detail', getRuleDetail)
  .get('/:id', getRule)
  .post('/', zValidator('json', CreateRuleSchema), createRule)
  .put('/:id', zValidator('json', UpdateRuleSchema), updateRule)
  .delete('/:id', deleteRule);
