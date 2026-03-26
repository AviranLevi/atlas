import { Hono } from 'hono';
import { getPreferences, updatePreferences } from '../controllers/preferences.controller.js';

export const preferencesRoute = new Hono()
  .get('/', getPreferences)
  .put('/', updatePreferences);
