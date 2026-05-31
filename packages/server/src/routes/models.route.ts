// External
import { Hono } from 'hono';

// Controllers
import { listCachedModels, refreshModelCache } from '../controllers/models.controller.js';

export const modelsRoute = new Hono().get('/', listCachedModels).post('/refresh', refreshModelCache);
