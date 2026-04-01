// External
import type { Context } from 'hono';

// Shared
import type {
  CreateDispatchRule,
  CreateGlobalInstructions,
  UpdateDispatchRule,
  UpdateGlobalInstructions,
} from '@atlas/shared';

// Services
import { settingsService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

/** Returns the singleton global instructions document. */
export async function getCurrentGlobalInstructions(c: Context) {
  const item = await settingsService.getOrCreateGlobalInstructions();
  return c.json(item);
}

/** Updates the singleton global instructions document. */
export async function updateCurrentGlobalInstructions(c: Context) {
  const data = getValidatedBody<UpdateGlobalInstructions>(c);
  const item = await settingsService.updateOrCreateGlobalInstructions(data);
  return c.json(item);
}

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
  const data = getValidatedBody<CreateGlobalInstructions>(c);
  const item = await settingsService.createGlobalInstructions(data);
  return c.json(item, 201);
}

/** Updates a global instruction by ID. */
export async function updateGlobalInstruction(c: Context) {
  const item = await settingsService.updateGlobalInstructions(
    c.req.param('id')!,
    getValidatedBody<UpdateGlobalInstructions>(c),
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
  const data = getValidatedBody<CreateDispatchRule>(c);
  const item = await settingsService.createDispatchRule(data);
  return c.json(item, 201);
}

/** Updates a dispatch rule by ID. */
export async function updateDispatchRule(c: Context) {
  const item = await settingsService.updateDispatchRule(c.req.param('id')!, getValidatedBody<UpdateDispatchRule>(c));
  return c.json(item);
}

/** Deletes a dispatch rule by ID. */
export async function deleteDispatchRule(c: Context) {
  await settingsService.deleteDispatchRule(c.req.param('id')!);
  return c.body(null, 204);
}
