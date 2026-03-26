// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { CreateAgentSchema, UpdateAgentSchema, AttachSkillSchema, AttachRuleSchema } from '@atlas/shared';

// Controllers
import {
  listAgents, getAgent, createAgent, updateAgent, deleteAgent,
  getAgentDetail, listAgentSkills, attachAgentSkill, detachAgentSkill,
  listAgentRules, attachAgentRule, detachAgentRule,
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
