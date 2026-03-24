// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import {
  CreateGlobalInstructionsSchema,
  UpdateGlobalInstructionsSchema,
  CreateDispatchRuleSchema,
  UpdateDispatchRuleSchema,
} from '@my-agents/shared';

// Controllers
import {
  getCurrentGlobalInstructions,
  updateCurrentGlobalInstructions,
  listGlobalInstructions,
  getGlobalInstruction,
  createGlobalInstruction,
  updateGlobalInstruction,
  deleteGlobalInstruction,
  listDispatchRules,
  getDispatchRule,
  createDispatchRule,
  updateDispatchRule,
  deleteDispatchRule,
} from '../controllers/settings.controller.js';

const globalInstructionsRoute = new Hono()
  .get('/current', getCurrentGlobalInstructions)
  .put('/current', zValidator('json', UpdateGlobalInstructionsSchema), updateCurrentGlobalInstructions)
  .get('/', listGlobalInstructions)
  .get('/:id', getGlobalInstruction)
  .post('/', zValidator('json', CreateGlobalInstructionsSchema), createGlobalInstruction)
  .put('/:id', zValidator('json', UpdateGlobalInstructionsSchema), updateGlobalInstruction)
  .delete('/:id', deleteGlobalInstruction);

const dispatchRulesRoute = new Hono()
  .get('/', listDispatchRules)
  .get('/:id', getDispatchRule)
  .post('/', zValidator('json', CreateDispatchRuleSchema), createDispatchRule)
  .put('/:id', zValidator('json', UpdateDispatchRuleSchema), updateDispatchRule)
  .delete('/:id', deleteDispatchRule);

export const settingsRoute = new Hono()
  .route('/global-instructions', globalInstructionsRoute)
  .route('/dispatch-rules', dispatchRulesRoute);
