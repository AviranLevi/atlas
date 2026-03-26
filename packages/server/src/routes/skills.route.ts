// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { CreateSkillSchema, UpdateSkillSchema } from '@atlas/shared';

// Controllers
import { listSkills, getSkill, getSkillDetail, createSkill, updateSkill, deleteSkill } from '../controllers/skills.controller.js';

export const skillsRoute = new Hono()
  .get('/', listSkills)
  .get('/:id/detail', getSkillDetail)
  .get('/:id', getSkill)
  .post('/', zValidator('json', CreateSkillSchema), createSkill)
  .put('/:id', zValidator('json', UpdateSkillSchema), updateSkill)
  .delete('/:id', deleteSkill);
