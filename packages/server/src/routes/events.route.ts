// External
import { Hono } from 'hono';

// Controllers
import { streamEvents } from '../controllers/events.controller.js';

export const eventsRoute = new Hono().get('/', streamEvents);
