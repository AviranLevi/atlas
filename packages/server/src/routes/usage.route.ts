// External
import { Hono } from 'hono';

// Controllers
import { getUsageSummary } from '../controllers/usage.controller.js';

export const usageRoute = new Hono().get('/summary', getUsageSummary);
