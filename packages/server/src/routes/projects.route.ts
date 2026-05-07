// External
import { Hono } from 'hono';

// Shared
import {
  AssignAgentSchema,
  CreateBranchSchema,
  CreateProjectSchema,
  ImportRulesSchema,
  ScaffoldProjectSchema,
  UpdateProjectSchema,
} from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  assignProjectAgent,
  createProject,
  createProjectBranch,
  deleteProject,
  generateDesignContext,
  generateProjectBrief,
  getProject,
  getProjectBranches,
  getProjectContext,
  getProjectGitStatus,
  gitPullProject,
  importProjectRules,
  listProjectAgents,
  listProjects,
  openProjectInEditor,
  scaffoldProject,
  scanProject,
  unassignProjectAgent,
  updateProject,
} from '../controllers/projects.controller.js';

export const projectsRoute = new Hono()
  .get('/', listProjects)
  .get('/:id/branches', getProjectBranches)
  .post('/:id/branches', zValidator('json', CreateBranchSchema), createProjectBranch)
  .post('/:id/import-rules', zValidator('json', ImportRulesSchema), importProjectRules)
  .get('/:id/context', getProjectContext)
  .get('/:id', getProject)
  .post('/scaffold', zValidator('json', ScaffoldProjectSchema), scaffoldProject)
  .post('/', zValidator('json', CreateProjectSchema), createProject)
  .post('/:id/scan', scanProject)
  .post('/:id/generate-brief', generateProjectBrief)
  .post('/:id/generate-design-context', generateDesignContext)
  .put('/:id', zValidator('json', UpdateProjectSchema), updateProject)
  .delete('/:id', deleteProject)
  .get('/:id/agents', listProjectAgents)
  .post('/:id/agents', zValidator('json', AssignAgentSchema), assignProjectAgent)
  .delete('/:id/agents/:agentId', unassignProjectAgent)
  .post('/:id/open-in-editor', openProjectInEditor)
  .get('/:id/git-status', getProjectGitStatus)
  .post('/:id/git-pull', gitPullProject);
