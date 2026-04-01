// External
import { Hono } from 'hono';

// Shared
import { BrowseQuerySchema, ScanQuerySchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import { browseFilesystem, scanFilesystem } from '../controllers/filesystem.controller.js';

export const filesystemRoute = new Hono()
  .get('/browse', zValidator('query', BrowseQuerySchema), browseFilesystem)
  .get('/scan', zValidator('query', ScanQuerySchema), scanFilesystem);
