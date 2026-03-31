// External
import type { Context } from 'hono';

// Lib
import { AppError } from '../lib/errors.js';

// Services
import { usageService } from '../services/index.js';

/** Returns aggregated usage for the requested group and period. */
export async function getUsageSummary(c: Context) {
  const groupBy = c.req.query('groupBy');
  if (groupBy !== 'agent' && groupBy !== 'project') {
    throw new AppError('Invalid groupBy; expected agent or project', { status: 400 });
  }
  const period = c.req.query('period') ?? undefined;
  const projectId = c.req.query('projectId') ?? undefined;
  const summary = await usageService.getSummary(groupBy, period, projectId);
  return c.json(summary);
}
