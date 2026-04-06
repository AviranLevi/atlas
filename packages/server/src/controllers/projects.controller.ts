// External
import type { Context } from 'hono';

// Shared
import type { AssignAgent, CreateBranch, CreateProject, ImportRules, UpdateProject } from '@atlas/shared';

// Services
import {
  agentsService,
  briefGeneratorService,
  designContextGeneratorService,
  projectsService,
  rulesService,
} from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

/** Lists all projects. Pass include=summary for task/agent counts. */
export async function listProjects(c: Context) {
  const include = c.req.query('include');
  if (include === 'summary') {
    const projects = await projectsService.listWithSummary();
    return c.json(projects);
  }
  const projects = await projectsService.list();
  return c.json(projects);
}

/** Returns git branches for a project's local repository. */
export async function getProjectBranches(c: Context) {
  const branches = await projectsService.getBranches(c.req.param('id')!);
  return c.json(branches);
}

/** Bulk-imports detected AI config files as rules linked to the project. */
export async function importProjectRules(c: Context) {
  const projectId = c.req.param('id')!;
  const { items } = getValidatedBody<ImportRules>(c);
  const result = await rulesService.bulkImportRules(projectId, items);
  return c.json(result, 201);
}

/** Creates a new git branch in a project's local repository. */
export async function createProjectBranch(c: Context) {
  const { name, baseBranch } = getValidatedBody<CreateBranch>(c);
  const branch = await projectsService.createBranch(c.req.param('id')!, name, baseBranch);
  return c.json({ branch }, 201);
}

/** Returns the full context for a project (agents, tasks, memories). */
export async function getProjectContext(c: Context) {
  const ctx = await projectsService.getContext(c.req.param('id')!);
  return c.json(ctx);
}

/** Returns a project by ID. */
export async function getProject(c: Context) {
  const project = await projectsService.getById(c.req.param('id')!);
  return c.json(project);
}

/** Creates a new project. */
export async function createProject(c: Context) {
  const data = getValidatedBody<CreateProject>(c);
  const project = await projectsService.create(data);
  return c.json(project, 201);
}

/** Deep-scans the project directory, updates metadata, and regenerates the brief. */
export async function scanProject(c: Context) {
  const projectId = c.req.param('id')!;
  const _project = await projectsService.scanAndUpdate(projectId);
  await briefGeneratorService.generateAndSave(projectId);
  const final = await projectsService.getById(projectId);
  return c.json(final);
}

/** Regenerates the AI project brief from scan data and memories. */
export async function generateProjectBrief(c: Context) {
  await briefGeneratorService.generateAndSave(c.req.param('id')!);
  const project = await projectsService.getById(c.req.param('id')!);
  return c.json(project);
}

/** Generates a DESIGN.md for the project using AI and saves it as the design context. */
export async function generateDesignContext(c: Context) {
  const project = await designContextGeneratorService.generateAndSave(c.req.param('id')!);
  return c.json(project);
}

/** Updates a project by ID. */
export async function updateProject(c: Context) {
  const project = await projectsService.update(c.req.param('id')!, getValidatedBody<UpdateProject>(c));
  return c.json(project);
}

/** Deletes a project by ID. */
export async function deleteProject(c: Context) {
  await projectsService.delete(c.req.param('id')!);
  return c.body(null, 204);
}

/** Lists agents assigned to a project. */
export async function listProjectAgents(c: Context) {
  const agents = await agentsService.listByProject(c.req.param('id')!);
  return c.json(agents);
}

/** Assigns an agent to a project with an optional role. */
export async function assignProjectAgent(c: Context) {
  const { agentId, role } = getValidatedBody<AssignAgent>(c);
  await agentsService.assignToProject(agentId, c.req.param('id')!, role);
  return c.json({ ok: true }, 201);
}

/** Removes an agent assignment from a project. */
export async function unassignProjectAgent(c: Context) {
  await agentsService.unassignFromProject(c.req.param('agentId')!, c.req.param('id')!);
  return c.body(null, 204);
}
