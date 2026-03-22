// External
import { Hono } from 'hono';

// Controllers
import { browseFilesystem, scanFilesystem } from '../controllers/filesystem.controller.js';

export const filesystemRoute = new Hono()
  .get('/browse', browseFilesystem)
  .get('/scan', scanFilesystem);
