// External
import { Hono } from 'hono';

// Shared
import { CreateHeartbeatConfigSchema, UpdateHeartbeatConfigSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  createHeartbeatConfig,
  deleteHeartbeatConfig,
  getHeartbeatConfig,
  listHeartbeatConfigs,
  listHeartbeatHistory,
  triggerHeartbeat,
  updateHeartbeatConfig,
} from '../controllers/heartbeats.controller.js';

export const heartbeatsRoute = new Hono()
  .get('/agents/:agentId/heartbeats', listHeartbeatConfigs)
  .post('/agents/:agentId/heartbeats', zValidator('json', CreateHeartbeatConfigSchema), createHeartbeatConfig)
  .get('/agents/:agentId/heartbeats/history', listHeartbeatHistory)
  .get('/heartbeats/:id', getHeartbeatConfig)
  .put('/heartbeats/:id', zValidator('json', UpdateHeartbeatConfigSchema), updateHeartbeatConfig)
  .delete('/heartbeats/:id', deleteHeartbeatConfig)
  .post('/heartbeats/:id/trigger', triggerHeartbeat);
