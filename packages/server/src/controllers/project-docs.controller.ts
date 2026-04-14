// External
import type { Context } from 'hono';

// Shared
import type { CreateProjectDoc, GenerateDoc, UpdateProjectDoc } from '@atlas/shared';

// Services
import { docsGeneratorService, projectDocsService, projectsService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

/** Lists all docs across all projects. */
export async function listAllProjectDocs(c: Context) {
  return c.json(await projectDocsService.listAll());
}

/** Lists all docs for a project. */
export async function listProjectDocs(c: Context) {
  const projectId = c.req.param('projectId')!;
  return c.json(await projectDocsService.list(projectId));
}

/** Creates a new custom doc for a project. */
export async function createProjectDoc(c: Context) {
  const projectId = c.req.param('projectId')!;
  const body = getValidatedBody<CreateProjectDoc>(c);
  return c.json(await projectDocsService.create(projectId, body), 201);
}

/** Returns a single doc by ID. */
export async function getProjectDoc(c: Context) {
  return c.json(await projectDocsService.getById(c.req.param('docId')!));
}

/** Updates a doc's title and/or content. */
export async function updateProjectDoc(c: Context) {
  const body = getValidatedBody<UpdateProjectDoc>(c);
  return c.json(await projectDocsService.update(c.req.param('docId')!, body));
}

/** Deletes a doc by ID. */
export async function deleteProjectDoc(c: Context) {
  await projectDocsService.remove(c.req.param('docId')!);
  return c.body(null, 204);
}

/** AI-generates a doc (api-diagram, db-schema, or architecture) for a project. */
export async function generateProjectDoc(c: Context) {
  const projectId = c.req.param('projectId')!;
  const { type } = getValidatedBody<GenerateDoc>(c);

  const project = await projectsService.getById(projectId);
  if (!project.localPath) {
    return c.json({ error: 'Project has no local path — cannot scan files' }, 400);
  }

  const TITLES: Record<string, string> = {
    'api-diagram': 'API Endpoints',
    'db-schema': 'Database Schema',
    architecture: 'System Architecture',
  };

  let content: string;
  if (type === 'api-diagram') {
    content = await docsGeneratorService.generateApiDiagram(project);
  } else if (type === 'db-schema') {
    content = await docsGeneratorService.generateDbSchema(project);
  } else {
    content = await docsGeneratorService.generateArchitecture(project);
  }

  return c.json(await projectDocsService.saveGenerated(projectId, type, TITLES[type], content));
}
