// External
import { Hono } from 'hono';

// Shared
import { CreateSkillSchema, UpdateSkillSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  createSkill,
  deleteSkill,
  getSkill,
  getSkillDetail,
  listSkills,
  updateSkill,
} from '../controllers/skills.controller.js';

export const skillsRoute = new Hono()
  .get('/', listSkills)
  .get('/:id/detail', getSkillDetail)
  .get('/:id', getSkill)
  .post('/', zValidator('json', CreateSkillSchema), createSkill)
  .put('/:id', zValidator('json', UpdateSkillSchema), updateSkill)
  .delete('/:id', deleteSkill);
