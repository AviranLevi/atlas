// External
import { Hono } from 'hono';

// Shared
import { UpdatePreferencesSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import { getPreferences, updatePreferences } from '../controllers/preferences.controller.js';

export const preferencesRoute = new Hono()
  .get('/', getPreferences)
  .put('/', zValidator('json', UpdatePreferencesSchema), updatePreferences);
