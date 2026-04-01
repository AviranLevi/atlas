// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { BrowseQuerySchema, ScanQuerySchema } from '@atlas/shared';

// Controllers
import { browseFilesystem, scanFilesystem } from '../controllers/filesystem.controller.js';

export const filesystemRoute = new Hono()
  .get('/browse', zValidator('query', BrowseQuerySchema), browseFilesystem)
  .get('/scan', zValidator('query', ScanQuerySchema), scanFilesystem);
