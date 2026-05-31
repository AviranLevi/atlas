// External
import { Hono } from 'hono';

// Routes
import { agentProvidersRoute } from './agent-providers.route.js';
import { agentsRoute } from './agents.route.js';
import { quickActionsRoute } from './quick-actions.route.js';
import { chatRoute } from './chat.route.js';
import { filesystemRoute } from './filesystem.route.js';
import { heartbeatsRoute } from './heartbeats.route.js';
import { integrationsRoute } from './integrations.route.js';
import { mcpConfigRoute } from './mcp-config.route.js';
import { mcpServersRoute } from './mcp-servers.route.js';
import { memoryRoute } from './memory.route.js';
import { modelsRoute } from './models.route.js';
import { marketplaceRoute } from './marketplace.route.js';
import { packageRoute } from './package.route.js';
import { phasesRoute } from './phases.route.js';
import { pipelinesRoute } from './pipelines.route.js';
import { preferencesRoute } from './preferences.route.js';
import { docsRoute } from './docs.route.js';
import { projectDocsRoute } from './project-docs.route.js';
import { projectsRoute } from './projects.route.js';
import { reviewsRoute } from './reviews.route.js';
import { rulesRoute } from './rules.route.js';
import { searchRoute } from './search.route.js';
import { settingsRoute } from './settings.route.js';
import { skillsRoute } from './skills.route.js';
import { systemRoute } from './system.route.js';
import { tasksRoute } from './tasks.route.js';
import { usageRoute } from './usage.route.js';
import { workspacesRoute } from './workspaces.route.js';

export const apiRoutes = new Hono()
  .route('/agents', agentsRoute)
  .route('/quick-actions', quickActionsRoute)
  .route('/skills', skillsRoute)
  .route('/rules', rulesRoute)
  .route('/memory', memoryRoute)
  .route('/models', modelsRoute)
  .route('/tasks', tasksRoute)
  .route('/projects', projectsRoute)
  .route('/projects/:projectId/docs', projectDocsRoute)
  .route('/docs', docsRoute)
  .route('/settings', settingsRoute)
  .route('/search', searchRoute)
  .route('/workspaces', workspacesRoute)
  .route('/filesystem', filesystemRoute)
  .route('/mcp', mcpConfigRoute)
  .route('/agent-providers', agentProvidersRoute)
  .route('/phases', phasesRoute)
  .route('/pipelines', pipelinesRoute)
  .route('/reviews', reviewsRoute)
  .route('/chat', chatRoute)
  .route('/system', systemRoute)
  .route('/preferences', preferencesRoute)
  .route('/packages', packageRoute)
  .route('/marketplace', marketplaceRoute)
  .route('/integrations', integrationsRoute)
  .route('/mcp-servers', mcpServersRoute)
  .route('/usage', usageRoute)
  .route('/', heartbeatsRoute);
