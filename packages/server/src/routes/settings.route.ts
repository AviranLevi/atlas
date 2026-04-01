// External
import { Hono } from 'hono';

// Shared
import {
  CreateDispatchRuleSchema,
  CreateGlobalInstructionsSchema,
  UpdateDispatchRuleSchema,
  UpdateGlobalInstructionsSchema,
} from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  createDispatchRule,
  createGlobalInstruction,
  deleteDispatchRule,
  deleteGlobalInstruction,
  getCurrentGlobalInstructions,
  getDispatchRule,
  getGlobalInstruction,
  listDispatchRules,
  listGlobalInstructions,
  updateCurrentGlobalInstructions,
  updateDispatchRule,
  updateGlobalInstruction,
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
