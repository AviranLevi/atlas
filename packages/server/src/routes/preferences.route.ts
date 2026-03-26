import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { UpdatePreferencesSchema } from '@my-agents/shared';
import { getPreferences, updatePreferences } from '../controllers/preferences.controller.js';

export const preferencesRoute = new Hono()
  .get('/', getPreferences)
  .put('/', zValidator('json', UpdatePreferencesSchema), updatePreferences);
