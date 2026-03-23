// External
import type { Context } from 'hono';

// Shared
import type { CreateSkill, UpdateSkill } from '@my-agents/shared';

// Services
import { skillsService } from '../services/index.js';

/** Lists all skills. */
export async function listSkills(c: Context) {
  const skills = await skillsService.list();
  return c.json(skills);
}

/** Returns a skill by ID. */
export async function getSkill(c: Context) {
  const skill = await skillsService.getById(c.req.param('id')!);
  return c.json(skill);
}

/** Creates a new skill. */
export async function createSkill(c: Context) {
  const data = (c.req as any).valid('json') as CreateSkill;
  const skill = await skillsService.create(data);
  return c.json(skill, 201);
}

/** Updates a skill by ID. */
export async function updateSkill(c: Context) {
  const skill = await skillsService.update(c.req.param('id')!, (c.req as any).valid('json') as UpdateSkill);
  return c.json(skill);
}

/** Deletes a skill by ID. */
export async function deleteSkill(c: Context) {
  await skillsService.delete(c.req.param('id')!);
  return c.body(null, 204);
}
