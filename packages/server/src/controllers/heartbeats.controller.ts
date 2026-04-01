// External
import type { Context } from 'hono';

// Shared
import type { CreateHeartbeatConfig, UpdateHeartbeatConfig } from '@atlas/shared';

// Services
import { heartbeatService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

function parseHistoryLimit(c: Context): number {
  const raw = c.req.query('limit');
  if (!raw) return 50;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return 50;
  return Math.min(100, Math.max(1, n));
}

/** Lists heartbeat configs for an agent. */
export async function listHeartbeatConfigs(c: Context) {
  const agentId = c.req.param('agentId')!;
  const items = await heartbeatService.listConfigs(agentId);
  return c.json(items);
}

/** Returns a heartbeat config by ID. */
export async function getHeartbeatConfig(c: Context) {
  const item = await heartbeatService.getConfigById(c.req.param('id')!);
  return c.json(item);
}

/** Creates a heartbeat config for an agent. */
export async function createHeartbeatConfig(c: Context) {
  const agentId = c.req.param('agentId')!;
  const body = getValidatedBody<CreateHeartbeatConfig>(c);
  const item = await heartbeatService.createConfig({ ...body, agentId });
  await heartbeatService.refreshSchedules();
  return c.json(item, 201);
}

/** Updates a heartbeat config by ID. */
export async function updateHeartbeatConfig(c: Context) {
  const item = await heartbeatService.updateConfig(c.req.param('id')!, getValidatedBody<UpdateHeartbeatConfig>(c));
  await heartbeatService.refreshSchedules();
  return c.json(item);
}

/** Deletes a heartbeat config by ID. */
export async function deleteHeartbeatConfig(c: Context) {
  await heartbeatService.deleteConfig(c.req.param('id')!);
  await heartbeatService.refreshSchedules();
  return c.body(null, 204);
}

/** Lists heartbeat run history for an agent. */
export async function listHeartbeatHistory(c: Context) {
  const agentId = c.req.param('agentId')!;
  const limit = parseHistoryLimit(c);
  const items = await heartbeatService.getRunHistory(agentId, limit);
  return c.json(items);
}

/** Triggers a heartbeat run immediately. */
export async function triggerHeartbeat(c: Context) {
  const run = await heartbeatService.triggerManual(c.req.param('id')!);
  return c.json(run);
}
