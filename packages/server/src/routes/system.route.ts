import { Hono } from 'hono';
import { exportDatabase, getSystemInfo, resetDatabase } from '../controllers/system.controller.js';

export const systemRoute = new Hono()
  .get('/info', getSystemInfo)
  .get('/export', exportDatabase)
  .post('/reset', resetDatabase);
