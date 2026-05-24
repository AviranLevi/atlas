// External
import type { Context } from 'hono';

// Shared
import type { CreateAutomation, UpdateAutomation } from '@atlas/shared';

// Services
import { automationsService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

export async function listAutomations(c: Context) {
  const projectId = c.req.query('projectId');
  const automations = await automationsService.list(projectId ? { projectId } : undefined);
  return c.json(automations);
}

export async function getAutomation(c: Context) {
  const automation = await automationsService.getById(c.req.param('id')!);
  return c.json(automation);
}

export async function createAutomation(c: Context) {
  const data = getValidatedBody<CreateAutomation>(c);
  const automation = await automationsService.create(data);
  return c.json(automation, 201);
}

export async function updateAutomation(c: Context) {
  const automation = await automationsService.update(c.req.param('id')!, getValidatedBody<UpdateAutomation>(c));
  return c.json(automation);
}

export async function deleteAutomation(c: Context) {
  await automationsService.delete(c.req.param('id')!);
  return c.body(null, 204);
}

export async function listAutomationTemplates(c: Context) {
  return c.json(automationsService.listTemplates());
}

export async function runAutomation(c: Context) {
  const { projectId } = getValidatedBody<{ projectId: string }>(c);
  const workspace = await automationsService.runAutomation(c.req.param('id')!, projectId);
  return c.json(workspace, 201);
}
