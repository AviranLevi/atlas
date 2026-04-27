// External
import type { Server as HttpServer } from 'node:http';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ZodError } from 'zod';

import { startMcpHttpServer } from './mcp-http.js';
import { apiRoutes } from './routes/index.js';
import { authRoute } from './routes/auth.route.js';
import { activityLogService, heartbeatService, orchestratorService } from './services/index.js';
import { activeProcesses, markShuttingDown } from './services/orchestrator/shared/index.js';
import { startupCleanupService } from './services/orchestrator/lifecycle/startup-cleanup.service.js';
import { startZombieSweeper } from './services/orchestrator/lifecycle/zombie-sweeper.js';
import { workspacesRepository } from './db/repositories/index.js';

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
    // Forward a structured `cause` payload (e.g. { agentName, taskCount } on
    // a 409 RESTRICT block) so the client can render a precise toast/modal
    // without parsing the message string.
    const body: { error: string; details?: Record<string, unknown> } = { error: err.message };
    if (err.cause && typeof err.cause === 'object' && !(err.cause instanceof Error)) {
      body.details = err.cause as Record<string, unknown>;
    }
    return c.json(body, err.status as 400 | 404 | 409 | 500);
  }
  if (err instanceof ZodError) {
    return c.json({ error: 'Invalid request body', issues: err.issues }, 400);
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
const server = serve({ fetch: app.fetch, port });
logger.info(`Server running on http://localhost:${port}`);

const mcpHttp = startMcpHttpServer();

orchestratorService.reconcileOnStartup();
heartbeatService.start();
const zombieSweeperInterval = startZombieSweeper();

startupCleanupService.runNow();
const startupCleanupInterval = startupCleanupService.scheduleDaily();

// ─── Graceful shutdown ───────────────────────────────────────────────────────
// Keeps in-flight agent children from being orphaned when the Atlas server
// exits. Ordering is deliberate:
//   1. Mark shuttingDown so spawn paths refuse new work (belt).
//   2. Stop heartbeat BEFORE iterating so a cron tick can't race us into
//      spawning a new workspace after the snapshot (suspenders).
//   3. SIGTERM every active child's process group, write DB status=stopped,
//      emit an activity log entry so history shows why the workspace ended.
//   4. Close HTTP servers (drop keep-alive first so long-polling clients
//      don't delay close). Do not await — the grace timer decides hard exit.
//   5. After SHUTDOWN_GRACE_MS, SIGKILL any survivors and exit.

const SHUTDOWN_GRACE_MS = 3000;
let shutdownTriggered = false;

function gracefulShutdown(signal: string): void {
  if (shutdownTriggered) return;
  shutdownTriggered = true;
  markShuttingDown();
  logger.info(`Received ${signal}, shutting down`);

  try {
    heartbeatService.stop();
  } catch (e) {
    logger.warn('heartbeat stop failed', e);
  }

  try {
    clearInterval(zombieSweeperInterval);
  } catch (e) {
    logger.warn('zombie sweeper stop failed', e);
  }

  try {
    clearInterval(startupCleanupInterval);
  } catch (e) {
    logger.warn('startup cleanup stop failed', e);
  }

  const entries = Array.from(activeProcesses.entries());
  for (const [workspaceId, entry] of entries) {
    const proc = entry.process;
    if (proc.pid) {
      try {
        process.kill(-proc.pid, 'SIGTERM');
      } catch {
        try {
          proc.kill('SIGTERM');
        } catch {
          /* already dead */
        }
      }
      logger.info(`Sent SIGTERM to workspace ${workspaceId} (pid ${proc.pid})`);
    }

    try {
      const ws = workspacesRepository.findById(workspaceId);
      // Don't overwrite a terminal status set by a natural onCompleted/onFailed
      // that raced the shutdown signal. If the child exited in the same tick we
      // sent SIGTERM, its close handler may have already written 'completed' or
      // 'failed' — forcing 'stopped' over that would lie about why it ended.
      const alreadyTerminal = ws && (ws.status === 'completed' || ws.status === 'failed' || ws.status === 'stopped');
      if (!alreadyTerminal) {
        workspacesRepository.update(workspaceId, {
          status: 'stopped',
          completedAt: new Date().toISOString(),
        });
      }
      if (ws && !alreadyTerminal) {
        activityLogService.log({
          projectId: ws.projectId,
          taskId: ws.taskId,
          workspaceId,
          agentId: ws.agentId,
          eventType: 'agent_stopped',
          description: `Server shutdown (${signal})`,
          metadata: { signal },
        });
      }
    } catch (e) {
      logger.warn(`shutdown DB/activity update failed for workspace ${workspaceId}`, e);
    }
  }

  // Cast — @hono/node-server's Serve return type doesn't surface
  // closeAllConnections() but the underlying handle is a Node http.Server.
  const mcpHttpServer = mcpHttp as unknown as HttpServer;
  try {
    mcpHttpServer.closeAllConnections?.();
    mcpHttpServer.close?.();
  } catch (e) {
    logger.warn('mcp http close failed', e);
  }

  const honoHttpServer = server as unknown as HttpServer;
  try {
    honoHttpServer.closeAllConnections?.();
    honoHttpServer.close?.();
  } catch (e) {
    logger.warn('hono server close failed', e);
  }

  const timer = setTimeout(() => {
    for (const [, entry] of entries) {
      const proc = entry.process;
      if (!proc.pid) continue;
      try {
        process.kill(-proc.pid, 'SIGKILL');
      } catch {
        try {
          proc.kill('SIGKILL');
        } catch {
          /* already dead */
        }
      }
    }
    process.exit(0);
  }, SHUTDOWN_GRACE_MS);
  timer.unref();
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
