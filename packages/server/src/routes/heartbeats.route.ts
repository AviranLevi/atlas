// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { CreateHeartbeatConfigSchema, UpdateHeartbeatConfigSchema } from '@atlas/shared';

// Controllers
import {
  listHeartbeatConfigs,
  getHeartbeatConfig,
  createHeartbeatConfig,
  updateHeartbeatConfig,
  deleteHeartbeatConfig,
  listHeartbeatHistory,
  triggerHeartbeat,
} from '../controllers/heartbeats.controller.js';

export const heartbeatsRoute = new Hono()
  .get('/agents/:agentId/heartbeats', listHeartbeatConfigs)
  .post('/agents/:agentId/heartbeats', zValidator('json', CreateHeartbeatConfigSchema), createHeartbeatConfig)
  .get('/agents/:agentId/heartbeats/history', listHeartbeatHistory)
  .get('/heartbeats/:id', getHeartbeatConfig)
  .put('/heartbeats/:id', zValidator('json', UpdateHeartbeatConfigSchema), updateHeartbeatConfig)
  .delete('/heartbeats/:id', deleteHeartbeatConfig)
  .post('/heartbeats/:id/trigger', triggerHeartbeat);
