// External
import type { Context } from 'hono';

// Shared
import type { CreateQuickAction, UpdateQuickAction } from '@atlas/shared';

// Services
import { quickActionsService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

export async function listQuickActions(c: Context) {
  const projectId = c.req.query('projectId');
  const quickActions = await quickActionsService.list(projectId ? { projectId } : undefined);
  return c.json(quickActions);
}

export async function getQuickAction(c: Context) {
  const quickAction = await quickActionsService.getById(c.req.param('id')!);
  return c.json(quickAction);
}

export async function createQuickAction(c: Context) {
  const data = getValidatedBody<CreateQuickAction>(c);
  const quickAction = await quickActionsService.create(data);
  return c.json(quickAction, 201);
}

export async function updateQuickAction(c: Context) {
  const quickAction = await quickActionsService.update(c.req.param('id')!, getValidatedBody<UpdateQuickAction>(c));
  return c.json(quickAction);
}

export async function deleteQuickAction(c: Context) {
  await quickActionsService.delete(c.req.param('id')!);
  return c.body(null, 204);
}

export async function listQuickActionTemplates(c: Context) {
  return c.json(quickActionsService.listTemplates());
}

export async function runQuickAction(c: Context) {
  const { projectId } = getValidatedBody<{ projectId: string }>(c);
  const workspace = await quickActionsService.runQuickAction(c.req.param('id')!, projectId);
  return c.json(workspace, 201);
}
