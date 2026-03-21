import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AppError } from './lib/errors.js';
import { logger } from './lib/logger.js';
import { apiRoutes } from './routes/index.js';
import { orchestratorService } from './services/index.js';
import { startMcpHttpServer } from './mcp-http.js';

const app = new Hono();

app.use('*', cors());

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.message }, err.status as 400 | 404 | 500);
  }
  logger.error('Unhandled error', err);
  return c.json({ error: 'Internal server error' }, 500);
});

app.route('/api/v1', apiRoutes);

const port = 3100;
serve({ fetch: app.fetch, port });
logger.info(`Server running on http://localhost:${port}`);

startMcpHttpServer();

orchestratorService.reconcileOnStartup();
