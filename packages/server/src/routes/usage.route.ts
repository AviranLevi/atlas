import { Hono } from 'hono';
import { getUsageSummary } from '../controllers/usage.controller.js';

export const usageRoute = new Hono()
  .get('/summary', getUsageSummary);
