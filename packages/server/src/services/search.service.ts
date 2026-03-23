// External
import { like, or, sql } from 'drizzle-orm';

// DB
import { db } from '../db/index.js';
import { agents, skills, rules, memory, tasks, projects } from '../db/schema/index.js';

// Lib
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';

const FILE_PATH = 'services/search.service.ts';

export type SearchResult = {
  type: 'agent' | 'skill' | 'rule' | 'memory' | 'task' | 'project';
  id: string;
  name: string;
  snippet?: string;
};

export class SearchService {
  /**
   * Full-text search across all entities using SQLite LIKE.
   * @param query - The search query string.
   */
  search(query: string): SearchResult[] {
    const FUNCTION_NAME = 'search';
    try {
      const pattern = `%${query}%`;
      const results: SearchResult[] = [];

      const agentRows = db
        .select({ id: agents.id, name: agents.name, description: agents.description })
        .from(agents)
        .where(or(like(agents.name, pattern), like(agents.description, pattern), like(agents.personality, pattern)))
        .all();
      for (const r of agentRows) {
        results.push({ type: 'agent', id: r.id, name: r.name, snippet: r.description ?? undefined });
      }

      const skillRows = db
        .select({ id: skills.id, name: skills.name, steps: skills.steps })
        .from(skills)
        .where(or(like(skills.name, pattern), like(skills.steps, pattern)))
        .all();
      for (const r of skillRows) {
        results.push({ type: 'skill', id: r.id, name: r.name, snippet: r.steps ?? undefined });
      }

      const ruleRows = db
        .select({ id: rules.id, name: rules.name, content: rules.content })
        .from(rules)
        .where(or(like(rules.name, pattern), like(rules.content, pattern)))
        .all();
      for (const r of ruleRows) {
        results.push({ type: 'rule', id: r.id, name: r.name, snippet: r.content?.slice(0, 200) ?? undefined });
      }

      const memoryRows = db
        .select({ id: memory.id, name: memory.name, content: memory.content })
        .from(memory)
        .where(or(like(memory.name, pattern), like(memory.content, pattern)))
        .all();
      for (const r of memoryRows) {
        results.push({ type: 'memory', id: r.id, name: r.name ?? 'Untitled', snippet: r.content?.slice(0, 200) ?? undefined });
      }

      const taskRows = db
        .select({ id: tasks.id, name: tasks.name, notes: tasks.notes })
        .from(tasks)
        .where(or(like(tasks.name, pattern), like(tasks.notes, pattern)))
        .all();
      for (const r of taskRows) {
        results.push({ type: 'task', id: r.id, name: r.name, snippet: r.notes ?? undefined });
      }

      const projectRows = db
        .select({ id: projects.id, name: projects.name, description: projects.description })
        .from(projects)
        .where(or(like(projects.name, pattern), like(projects.description, pattern)))
        .all();
      for (const r of projectRows) {
        results.push({ type: 'project', id: r.id, name: r.name, snippet: r.description ?? undefined });
      }

      return results;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to search', { cause: error });
    }
  }
}
