// External
import type { Context } from 'hono';

// Shared
import type { AttachRule, AttachSkill, CreateAgent, UpdateAgent } from '@atlas/shared';

// Services
import { agentsService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

/** Lists all agents. */
export async function listAgents(c: Context) {
  const agents = await agentsService.list();
  return c.json(agents);
}

/** Returns an agent by ID. */
export async function getAgent(c: Context) {
  const agent = await agentsService.getById(c.req.param('id')!);
  return c.json(agent);
}

/** Creates a new agent. */
export async function createAgent(c: Context) {
  const data = getValidatedBody<CreateAgent>(c);
  const agent = await agentsService.create(data);
  return c.json(agent, 201);
}

/** Updates an agent by ID. */
export async function updateAgent(c: Context) {
  const agent = await agentsService.update(c.req.param('id')!, getValidatedBody<UpdateAgent>(c));
  return c.json(agent);
}

/** Deletes an agent by ID. */
export async function deleteAgent(c: Context) {
  await agentsService.delete(c.req.param('id')!);
  return c.body(null, 204);
}

/** Returns agent detail with skills, rules, and projects. */
export async function getAgentDetail(c: Context) {
  const detail = await agentsService.getDetail(c.req.param('id')!);
  return c.json(detail);
}

/** Lists skills attached to an agent. */
export async function listAgentSkills(c: Context) {
  const skills = await agentsService.listSkills(c.req.param('id')!);
  return c.json(skills);
}

/** Attaches a skill to an agent. */
export async function attachAgentSkill(c: Context) {
  const { skillId } = getValidatedBody<AttachSkill>(c);
  await agentsService.attachSkill(c.req.param('id')!, skillId);
  return c.body(null, 201);
}

/** Detaches a skill from an agent. */
export async function detachAgentSkill(c: Context) {
  await agentsService.detachSkill(c.req.param('id')!, c.req.param('skillId')!);
  return c.body(null, 204);
}

/** Lists rules attached to an agent. */
export async function listAgentRules(c: Context) {
  const rules = await agentsService.listRules(c.req.param('id')!);
  return c.json(rules);
}

/** Attaches a rule to an agent. */
export async function attachAgentRule(c: Context) {
  const { ruleId } = getValidatedBody<AttachRule>(c);
  await agentsService.attachRule(c.req.param('id')!, ruleId);
  return c.body(null, 201);
}

/** Detaches a rule from an agent. */
export async function detachAgentRule(c: Context) {
  await agentsService.detachRule(c.req.param('id')!, c.req.param('ruleId')!);
  return c.body(null, 204);
}
