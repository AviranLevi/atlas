// External
import { Hono } from 'hono';

// Shared
import { AttachRuleSchema, AttachSkillSchema, CreateAgentSchema, UpdateAgentSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  attachAgentRule,
  attachAgentSkill,
  createAgent,
  deleteAgent,
  detachAgentRule,
  detachAgentSkill,
  getAgent,
  getAgentDetail,
  listAgentRules,
  listAgentSkills,
  listAgents,
  updateAgent,
} from '../controllers/agents.controller.js';

export const agentsRoute = new Hono()
  .get('/', listAgents)
  .get('/:id', getAgent)
  .post('/', zValidator('json', CreateAgentSchema), createAgent)
  .put('/:id', zValidator('json', UpdateAgentSchema), updateAgent)
  .delete('/:id', deleteAgent)
  .get('/:id/detail', getAgentDetail)
  .get('/:id/skills', listAgentSkills)
  .post('/:id/skills', zValidator('json', AttachSkillSchema), attachAgentSkill)
  .delete('/:id/skills/:skillId', detachAgentSkill)
  .get('/:id/rules', listAgentRules)
  .post('/:id/rules', zValidator('json', AttachRuleSchema), attachAgentRule)
  .delete('/:id/rules/:ruleId', detachAgentRule);
