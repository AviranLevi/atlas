// External
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { startMcpHttpServer } from './mcp-http.js';
import { apiRoutes } from './routes/index.js';
import { authRoute } from './routes/auth.route.js';
import { heartbeatService, orchestratorService } from './services/index.js';

// Lib
import { authMiddleware } from './lib/auth-middleware.js';
import { AppError } from './lib/errors.js';
import { logger } from './lib/logger.js';

const app = new Hono();

app.use('*', cors());

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.message }, err.status as 400 | 404 | 500);
  }
  logger.error('Unhandled error', err);
  return c.json({ error: 'Internal server error' }, 500);
});

app.use('/api/v1/*', async (c, next) => {
  if (c.req.path.startsWith('/api/v1/auth')) return next();
  return authMiddleware(c, next);
});
app.route('/api/v1/auth', authRoute);
app.route('/api/v1', apiRoutes);

const port = parseInt(process.env.PORT || '3100', 10);
serve({ fetch: app.fetch, port });
logger.info(`Server running on http://localhost:${port}`);

startMcpHttpServer();

orchestratorService.reconcileOnStartup();
heartbeatService.start();
