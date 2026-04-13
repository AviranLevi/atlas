// External
import { Hono } from 'hono';

// Shared
import { CreateProjectDocSchema, GenerateDocSchema, UpdateProjectDocSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  createProjectDoc,
  deleteProjectDoc,
  generateProjectDoc,
  getProjectDoc,
  listProjectDocs,
  updateProjectDoc,
} from '../controllers/project-docs.controller.js';

export const projectDocsRoute = new Hono()
  .get('/', listProjectDocs)
  .post('/', zValidator('json', CreateProjectDocSchema), createProjectDoc)
  .post('/generate', zValidator('json', GenerateDocSchema), generateProjectDoc)
  .get('/:docId', getProjectDoc)
  .put('/:docId', zValidator('json', UpdateProjectDocSchema), updateProjectDoc)
  .delete('/:docId', deleteProjectDoc);
