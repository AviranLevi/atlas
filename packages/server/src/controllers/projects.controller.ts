// External
import type { Context } from 'hono';
import { execSync } from 'child_process';

// Shared
import type { CreateProject, UpdateProject, AssignAgent } from '@my-agents/shared';

// Services
import { projectsService, briefGeneratorService, agentsService } from '../services/index.js';

// Lib
import { deepScanProject } from '../lib/filesystem-scanner/index.js';

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
  const project = await projectsService.getById(c.req.param('id')!);
  if (!project.localPath) return c.json([]);
  try {
    const output = execSync('git branch -a --format="%(refname:short)"', {
      cwd: project.localPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    const branches = output
      .split('\n')
      .filter(Boolean)
      .map((b) => b.replace(/^origin\//, ''))
      .filter((b) => !b.startsWith('HEAD') && !b.startsWith('agents/'));
    return c.json([...new Set(branches)]);
  } catch {
    return c.json([]);
  }
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
  const data = (c.req as any).valid('json') as CreateProject;
  const project = await projectsService.create(data);
  return c.json(project, 201);
}

/** Deep-scans the project directory, updates metadata, and regenerates the brief. */
export async function scanProject(c: Context) {
  const project = await projectsService.getById(c.req.param('id')!);
  if (!project.localPath) {
    return c.json({ error: 'Project has no local path' }, 400);
  }
  const scanData = deepScanProject(project.localPath);
  const updates: Record<string, unknown> = { scanData };
  if (!project.techStack) {
    const techs = [
      ...(scanData.languages ?? []),
      ...(scanData.dependencies?.filter((d) =>
        ['react', 'vue', 'svelte', 'angular', 'next', 'nuxt', 'express', 'fastify', 'hono', 'nestjs',
         'drizzle-orm', 'prisma', 'tailwindcss', 'vite', 'electron'].includes(d)
      ) ?? []),
    ];
    if (techs.length) updates.techStack = techs.join(', ');
  }
  await projectsService.update(c.req.param('id')!, updates);
  await briefGeneratorService.generateAndSave(c.req.param('id')!);
  const final = await projectsService.getById(c.req.param('id')!);
  return c.json(final);
}

/** Regenerates the AI project brief from scan data and memories. */
export async function generateProjectBrief(c: Context) {
  await briefGeneratorService.generateAndSave(c.req.param('id')!);
  const project = await projectsService.getById(c.req.param('id')!);
  return c.json(project);
}

/** Updates a project by ID. */
export async function updateProject(c: Context) {
  const project = await projectsService.update(
    c.req.param('id')!,
    (c.req as any).valid('json') as UpdateProject
  );
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
  const { agentId, role } = (c.req as any).valid('json') as AssignAgent;
  await agentsService.assignToProject(agentId, c.req.param('id')!, role);
  return c.json({ ok: true }, 201);
}

/** Removes an agent assignment from a project. */
export async function unassignProjectAgent(c: Context) {
  await agentsService.unassignFromProject(c.req.param('agentId')!, c.req.param('id')!);
  return c.body(null, 204);
}
