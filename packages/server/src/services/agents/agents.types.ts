// Shared
import type { Agent, Rule, Skill } from '@atlas/shared';

export type AgentContext = {
  agent: Agent;
  globalInstructions: string;
  skills: Record<string, unknown>[];
  rules: Record<string, unknown>[];
  projectSkills: Record<string, unknown>[];
  projectRules: Record<string, unknown>[];
  memories: Record<string, unknown>[];
};

export type AgentDetail = {
  agent: Agent;
  skills: Skill[];
  rules: Rule[];
  projects: Record<string, unknown>[];
};
