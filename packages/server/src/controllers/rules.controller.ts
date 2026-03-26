// External
import type { Context } from 'hono';

// Shared
import type { CreateRule, UpdateRule } from '@atlas/shared';

// Services
import { rulesService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

/** Lists all rules. */
export async function listRules(c: Context) {
  const rules = await rulesService.list();
  return c.json(rules);
}

/** Returns a rule by ID. */
export async function getRule(c: Context) {
  const rule = await rulesService.getById(c.req.param('id')!);
  return c.json(rule);
}

/** Creates a new rule. */
export async function createRule(c: Context) {
  const data = getValidatedBody<CreateRule>(c);
  const rule = await rulesService.create(data);
  return c.json(rule, 201);
}

/** Updates a rule by ID. */
export async function updateRule(c: Context) {
  const rule = await rulesService.update(c.req.param('id')!, getValidatedBody<UpdateRule>(c));
  return c.json(rule);
}

/** Deletes a rule by ID. */
export async function deleteRule(c: Context) {
  await rulesService.delete(c.req.param('id')!);
  return c.body(null, 204);
}

/** Returns a rule with its associated agents. */
export async function getRuleDetail(c: Context) {
  const detail = await rulesService.getDetail(c.req.param('id')!);
  return c.json(detail);
}
