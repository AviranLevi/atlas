// External
import type { Context } from 'hono';

// Shared
import type {
  CreateGlobalInstructions,
  UpdateGlobalInstructions,
  CreateDispatchRule,
  UpdateDispatchRule,
} from '@my-agents/shared';

// Services
import { settingsService } from '../services/index.js';

/** Lists all global instructions. */
export async function listGlobalInstructions(c: Context) {
  const items = await settingsService.listGlobalInstructions();
  return c.json(items);
}

/** Returns a global instruction by ID. */
export async function getGlobalInstruction(c: Context) {
  const item = await settingsService.getGlobalInstructionsById(c.req.param('id')!);
  return c.json(item);
}

/** Creates a new global instruction. */
export async function createGlobalInstruction(c: Context) {
  const data = (c.req as any).valid('json') as CreateGlobalInstructions;
  const item = await settingsService.createGlobalInstructions(data);
  return c.json(item, 201);
}

/** Updates a global instruction by ID. */
export async function updateGlobalInstruction(c: Context) {
  const item = await settingsService.updateGlobalInstructions(
    c.req.param('id')!,
    (c.req as any).valid('json') as UpdateGlobalInstructions
  );
  return c.json(item);
}

/** Deletes a global instruction by ID. */
export async function deleteGlobalInstruction(c: Context) {
  await settingsService.deleteGlobalInstructions(c.req.param('id')!);
  return c.body(null, 204);
}

/** Lists all dispatch rules. */
export async function listDispatchRules(c: Context) {
  const items = await settingsService.listDispatchRules();
  return c.json(items);
}

/** Returns a dispatch rule by ID. */
export async function getDispatchRule(c: Context) {
  const item = await settingsService.getDispatchRuleById(c.req.param('id')!);
  return c.json(item);
}

/** Creates a new dispatch rule. */
export async function createDispatchRule(c: Context) {
  const data = (c.req as any).valid('json') as CreateDispatchRule;
  const item = await settingsService.createDispatchRule(data);
  return c.json(item, 201);
}

/** Updates a dispatch rule by ID. */
export async function updateDispatchRule(c: Context) {
  const item = await settingsService.updateDispatchRule(
    c.req.param('id')!,
    (c.req as any).valid('json') as UpdateDispatchRule
  );
  return c.json(item);
}

/** Deletes a dispatch rule by ID. */
export async function deleteDispatchRule(c: Context) {
  await settingsService.deleteDispatchRule(c.req.param('id')!);
  return c.body(null, 204);
}
