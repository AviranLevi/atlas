// External
import { Hono } from 'hono';

// Controllers
import { listAllProjectDocs } from '../controllers/project-docs.controller.js';

export const docsRoute = new Hono().get('/', listAllProjectDocs);
