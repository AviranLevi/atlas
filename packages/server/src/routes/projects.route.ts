import { Hono } from 'hono';
import { execSync } from 'child_process';
import { zValidator } from '@hono/zod-validator';
import { CreateProjectSchema, UpdateProjectSchema, AssignAgentSchema } from '@my-agents/shared';
import { projectsService, briefGeneratorService, agentsService } from '../services/index.js';
import { deepScanProject } from './filesystem.route.js';

export const projectsRoute = new Hono()
  .get('/', async (c) => {
    const include = c.req.query('include');
    if (include === 'summary') {
      const projects = await projectsService.listWithSummary();
      return c.json(projects);
    }
    const projects = await projectsService.list();
    return c.json(projects);
  })
  .get('/:id/branches', async (c) => {
    const project = await projectsService.getById(c.req.param('id'));
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
  })
  .get('/:id/context', async (c) => {
    const ctx = await projectsService.getContext(c.req.param('id'));
    return c.json(ctx);
  })
  .get('/:id', async (c) => {
    const project = await projectsService.getById(c.req.param('id'));
    return c.json(project);
  })
  .post('/', zValidator('json', CreateProjectSchema), async (c) => {
    const data = c.req.valid('json');
    const project = await projectsService.create(data);
    return c.json(project, 201);
  })
  .post('/:id/scan', async (c) => {
    const project = await projectsService.getById(c.req.param('id'));
    if (!project.localPath) {
      return c.json({ error: 'Project has no local path' }, 400);
    }
    const scanData = deepScanProject(project.localPath);
    // Also update techStack and defaultBranch if they are empty
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
    await projectsService.update(c.req.param('id'), updates);
    // Auto-generate brief from scan data + memories
    await briefGeneratorService.generateAndSave(c.req.param('id'));
    // Return fresh project with brief
    const final = await projectsService.getById(c.req.param('id'));
    return c.json(final);
  })
  .post('/:id/generate-brief', async (c) => {
    const brief = await briefGeneratorService.generateAndSave(c.req.param('id'));
    const project = await projectsService.getById(c.req.param('id'));
    return c.json(project);
  })
  .put('/:id', zValidator('json', UpdateProjectSchema), async (c) => {
    const project = await projectsService.update(
      c.req.param('id'),
      c.req.valid('json')
    );
    return c.json(project);
  })
  .delete('/:id', async (c) => {
    await projectsService.delete(c.req.param('id'));
    return c.body(null, 204);
  })
  .get('/:id/agents', async (c) => {
    const agents = await agentsService.listByProject(c.req.param('id'));
    return c.json(agents);
  })
  .post('/:id/agents', zValidator('json', AssignAgentSchema), async (c) => {
    const { agentId, role } = c.req.valid('json');
    await agentsService.assignToProject(agentId, c.req.param('id'), role);
    return c.json({ ok: true }, 201);
  })
  .delete('/:id/agents/:agentId', async (c) => {
    await agentsService.unassignFromProject(c.req.param('agentId'), c.req.param('id'));
    return c.body(null, 204);
  });
