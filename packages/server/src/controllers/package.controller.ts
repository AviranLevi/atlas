// External
import type { Context } from 'hono';

// Shared
import type { AtlasPackage, ImportRequest } from '@atlas/shared';

// Services
import { packageService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

export async function exportAgent(c: Context): Promise<Response> {
  const id = c.req.param('id')!;
  const pkg = await packageService.exportAgent(id);
  const filename = `${slugify(pkg.name)}.atlas.json`;
  return new Response(JSON.stringify(pkg, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export async function exportSkill(c: Context): Promise<Response> {
  const id = c.req.param('id')!;
  const pkg = await packageService.exportSkill(id);
  const filename = `${slugify(pkg.name)}.atlas.json`;
  return new Response(JSON.stringify(pkg, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export async function exportRule(c: Context): Promise<Response> {
  const id = c.req.param('id')!;
  const pkg = await packageService.exportRule(id);
  const filename = `${slugify(pkg.name)}.atlas.json`;
  return new Response(JSON.stringify(pkg, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export async function previewImport(c: Context): Promise<Response> {
  const body = getValidatedBody<AtlasPackage>(c);
  const preview = await packageService.previewImport(body);
  return c.json(preview);
}

export async function executeImport(c: Context): Promise<Response> {
  const request = getValidatedBody<ImportRequest>(c);
  const summary = await packageService.executeImport(request);
  return c.json(summary, 201);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
