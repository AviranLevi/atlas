// External
import type { Context } from 'hono';

// Shared
import type { TestSupermemory, UpsertIntegration } from '@atlas/shared';

// Services
import { integrationsService, supermemoryService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

/** Lists all integrations (API keys are included — treat as sensitive). */
export async function listIntegrations(c: Context) {
  return c.json(await integrationsService.list());
}

/** Returns a single integration by name. */
export async function getIntegration(c: Context) {
  const name = c.req.param('name')!;
  const integration = await integrationsService.getByName(name);
  if (!integration) return c.json({ id: null, name, apiKey: null, baseUrl: null, enabled: false }, 200);
  return c.json(integration);
}

/** Upserts an integration by name. */
export async function upsertIntegration(c: Context) {
  const name = c.req.param('name')!;
  const data = getValidatedBody<UpsertIntegration>(c);
  const integration = await integrationsService.upsert(name, data);
  return c.json(integration);
}

/** Tests the Supermemory connection using the provided (or stored) credentials. */
export async function testSupermemoryConnection(c: Context) {
  const body = getValidatedBody<TestSupermemory>(c);

  const stored = await integrationsService.getByName('supermemory');
  const apiKey = body.apiKey ?? stored?.apiKey ?? '';
  const baseUrl = body.baseUrl ?? stored?.baseUrl ?? null;

  if (!apiKey) return c.json({ ok: false, error: 'No API key provided' }, 400);

  const result = await supermemoryService.testConnection(apiKey, baseUrl);
  return c.json(result);
}
