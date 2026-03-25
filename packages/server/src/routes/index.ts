// External
import { Hono } from 'hono';

// Routes
import { agentsRoute } from './agents.route.js';
import { skillsRoute } from './skills.route.js';
import { rulesRoute } from './rules.route.js';
import { memoryRoute } from './memory.route.js';
import { tasksRoute } from './tasks.route.js';
import { projectsRoute } from './projects.route.js';
import { settingsRoute } from './settings.route.js';
import { searchRoute } from './search.route.js';
import { workspacesRoute } from './workspaces.route.js';
import { filesystemRoute } from './filesystem.route.js';
import { mcpConfigRoute } from './mcp-config.route.js';
import { agentProvidersRoute } from './agent-providers.route.js';
import { phasesRoute } from './phases.route.js';
import { reviewsRoute } from './reviews.route.js';
import { chatRoute } from './chat.route.js';

export const apiRoutes = new Hono()
  .route('/agents', agentsRoute)
  .route('/skills', skillsRoute)
  .route('/rules', rulesRoute)
  .route('/memory', memoryRoute)
  .route('/tasks', tasksRoute)
  .route('/projects', projectsRoute)
  .route('/settings', settingsRoute)
  .route('/search', searchRoute)
  .route('/workspaces', workspacesRoute)
  .route('/filesystem', filesystemRoute)
  .route('/mcp', mcpConfigRoute)
  .route('/agent-providers', agentProvidersRoute)
  .route('/phases', phasesRoute)
  .route('/reviews', reviewsRoute)
  .route('/chat', chatRoute);
