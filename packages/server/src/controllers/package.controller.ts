// External
import type { Context } from 'hono';

// Shared
import type { AtlasPackage, ImportResolution } from '@atlas/shared';

// Services
import { packageExporterService, packageImporterService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

/** Exports a skill as an Atlas Package. */
export async function exportSkill(c: Context): Promise<Response> {
  const pkg = await packageExporterService.exportSkill(c.req.param('id')!);
  return c.json(pkg);
}

/** Exports a rule as an Atlas Package. */
export async function exportRule(c: Context): Promise<Response> {
  const pkg = await packageExporterService.exportRule(c.req.param('id')!);
  return c.json(pkg);
}

/** Exports an agent as an Atlas Package. */
export async function exportAgent(c: Context): Promise<Response> {
  const pkg = await packageExporterService.exportAgent(c.req.param('id')!);
  return c.json(pkg);
}

/** Exports a collection of items as an Atlas Package. */
export async function exportCollection(c: Context): Promise<Response> {
  const body = getValidatedBody<{ skillIds: string[]; ruleIds: string[]; agentIds: string[] }>(c);
  const pkg = await packageExporterService.exportCollection(body);
  return c.json(pkg);
}

/** Previews importing an Atlas Package. */
export async function previewImport(c: Context): Promise<Response> {
  const body = getValidatedBody<AtlasPackage>(c);
  const preview = await packageImporterService.previewImport(body);
  return c.json(preview);
}

/** Applies an import with resolved conflicts. */
export async function applyImport(c: Context): Promise<Response> {
  const body = getValidatedBody<{ package: AtlasPackage; resolutions: ImportResolution[]; projectId?: string }>(c);
  const summary = await packageImporterService.applyImport(body.package, body.resolutions, body.projectId);
  return c.json(summary, 201);
}
