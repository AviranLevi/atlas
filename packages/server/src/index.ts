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

// Node version guard — must be ≥24
{
  const REQUIRED_MAJOR = 24;
  const [major] = process.versions.node.split('.').map(Number);
  if (major < REQUIRED_MAJOR) {
    const v = process.versions.node;
    const r = '\x1b[0m';
    const red = '\x1b[31m';
    const bold = '\x1b[1m';
    console.error(`
${red}${bold}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ⚠️  UNSUPPORTED NODE.JS VERSION                             ║
║                                                              ║
║   Atlas requires Node.js ${REQUIRED_MAJOR} or later.                       ║
║   You are running: v${v.padEnd(40)}║
║                                                              ║
║   Upgrade:  https://nodejs.org                               ║
║   With nvm: nvm install ${REQUIRED_MAJOR} && nvm use ${REQUIRED_MAJOR}                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝${r}
`);
    process.exit(1);
  }
}

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
