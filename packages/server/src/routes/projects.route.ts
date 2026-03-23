// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { CreateProjectSchema, UpdateProjectSchema, AssignAgentSchema } from '@my-agents/shared';

// Controllers
import {
  listProjects,
  getProjectBranches,
  getProjectContext,
  getProject,
  createProject,
  scanProject,
  generateProjectBrief,
  updateProject,
  deleteProject,
  listProjectAgents,
  assignProjectAgent,
  unassignProjectAgent,
} from '../controllers/projects.controller.js';

export const projectsRoute = new Hono()
  .get('/', listProjects)
  .get('/:id/branches', getProjectBranches)
  .get('/:id/context', getProjectContext)
  .get('/:id', getProject)
  .post('/', zValidator('json', CreateProjectSchema), createProject)
  .post('/:id/scan', scanProject)
  .post('/:id/generate-brief', generateProjectBrief)
  .put('/:id', zValidator('json', UpdateProjectSchema), updateProject)
  .delete('/:id', deleteProject)
  .get('/:id/agents', listProjectAgents)
  .post('/:id/agents', zValidator('json', AssignAgentSchema), assignProjectAgent)
  .delete('/:id/agents/:agentId', unassignProjectAgent);
