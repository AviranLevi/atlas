// External
import { and, desc, eq, gte, isNotNull, sql } from 'drizzle-orm';

// Shared
import type { UsageLog } from '@atlas/shared';

// DB
import type { DB } from '../index.js';
import { usageLogs } from '../schema/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'db/repositories/usage.repository.ts';

export type UsageInsertInput = {
  conversationId?: string;
  agentId?: string;
  taskId?: string;
  projectId?: string;
  workspaceId?: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model?: string;
  providerType?: string;
};

function mapRow(row: typeof usageLogs.$inferSelect): UsageLog {
  return {
    id: row.id,
    workspaceId: row.workspaceId ?? null,
    conversationId: row.conversationId ?? null,
    agentId: row.agentId ?? null,
    taskId: row.taskId ?? null,
    projectId: row.projectId ?? null,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    totalTokens: row.totalTokens,
    model: row.model ?? null,
    providerType: row.providerType ?? null,
    createdAt: row.createdAt,
  };
}

export class UsageRepository {
  constructor(private readonly db: DB) {}

  /** Inserts a usage log row and returns the created record. */
  insert(data: UsageInsertInput): UsageLog {
    const FUNCTION_NAME = 'insert';
    try {
      const row = this.db
        .insert(usageLogs)
        .values({
          conversationId: data.conversationId ?? null,
          agentId: data.agentId ?? null,
          taskId: data.taskId ?? null,
          projectId: data.projectId ?? null,
          workspaceId: data.workspaceId ?? null,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          totalTokens: data.totalTokens,
          model: data.model ?? null,
          providerType: data.providerType ?? null,
        })
        .returning()
        .get();
      return mapRow(row);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert usage log', { cause: error });
    }
  }

  /** Returns usage logs for an agent, newest first. */
  findByAgent(agentId: string, since?: string): UsageLog[] {
    const FUNCTION_NAME = 'findByAgent';
    try {
      const conds = since
        ? and(eq(usageLogs.agentId, agentId), gte(usageLogs.createdAt, since))
        : eq(usageLogs.agentId, agentId);
      const rows = this.db.select().from(usageLogs).where(conds!).orderBy(desc(usageLogs.createdAt)).all();
      return rows.map(mapRow);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query usage by agent', { cause: error });
    }
  }

  /** Returns usage logs for a project, newest first. */
  findByProject(projectId: string, since?: string): UsageLog[] {
    const FUNCTION_NAME = 'findByProject';
    try {
      const conds = since
        ? and(eq(usageLogs.projectId, projectId), gte(usageLogs.createdAt, since))
        : eq(usageLogs.projectId, projectId);
      const rows = this.db.select().from(usageLogs).where(conds!).orderBy(desc(usageLogs.createdAt)).all();
      return rows.map(mapRow);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query usage by project', { cause: error });
    }
  }

  /** Returns usage logs for a conversation, newest first. */
  findByConversation(conversationId: string): UsageLog[] {
    const FUNCTION_NAME = 'findByConversation';
    try {
      const rows = this.db
        .select()
        .from(usageLogs)
        .where(eq(usageLogs.conversationId, conversationId))
        .orderBy(desc(usageLogs.createdAt))
        .all();
      return rows.map(mapRow);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query usage by conversation', { cause: error });
    }
  }

  /** Aggregates token usage grouped by agent. */
  getSummaryByAgent(
    since?: string,
    projectId?: string,
  ): { agentId: string; inputTokens: number; outputTokens: number; totalTokens: number; runs: number }[] {
    const FUNCTION_NAME = 'getSummaryByAgent';
    try {
      const conds = [isNotNull(usageLogs.agentId)];
      if (since) conds.push(gte(usageLogs.createdAt, since));
      if (projectId) conds.push(eq(usageLogs.projectId, projectId));
      const rows = this.db
        .select({
          agentId: usageLogs.agentId,
          inputTokens: sql<number>`coalesce(sum(${usageLogs.inputTokens}), 0)`.as('inputTokens'),
          outputTokens: sql<number>`coalesce(sum(${usageLogs.outputTokens}), 0)`.as('outputTokens'),
          totalTokens: sql<number>`coalesce(sum(${usageLogs.totalTokens}), 0)`.as('totalTokens'),
          runs: sql<number>`count(*)`.as('runs'),
        })
        .from(usageLogs)
        .where(and(...conds))
        .groupBy(usageLogs.agentId)
        .all();
      return rows
        .filter((r): r is typeof r & { agentId: string } => r.agentId != null)
        .map((r) => ({
          agentId: r.agentId,
          inputTokens: Number(r.inputTokens),
          outputTokens: Number(r.outputTokens),
          totalTokens: Number(r.totalTokens),
          runs: Number(r.runs),
        }));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to aggregate usage by agent', { cause: error });
    }
  }

  /** Aggregates token usage grouped by project. */
  getSummaryByProject(
    since?: string,
    projectIdFilter?: string,
  ): { projectId: string; inputTokens: number; outputTokens: number; totalTokens: number; runs: number }[] {
    const FUNCTION_NAME = 'getSummaryByProject';
    try {
      const conds = [isNotNull(usageLogs.projectId)];
      if (since) conds.push(gte(usageLogs.createdAt, since));
      if (projectIdFilter) conds.push(eq(usageLogs.projectId, projectIdFilter));
      const rows = this.db
        .select({
          projectId: usageLogs.projectId,
          inputTokens: sql<number>`coalesce(sum(${usageLogs.inputTokens}), 0)`.as('inputTokens'),
          outputTokens: sql<number>`coalesce(sum(${usageLogs.outputTokens}), 0)`.as('outputTokens'),
          totalTokens: sql<number>`coalesce(sum(${usageLogs.totalTokens}), 0)`.as('totalTokens'),
          runs: sql<number>`count(*)`.as('runs'),
        })
        .from(usageLogs)
        .where(and(...conds))
        .groupBy(usageLogs.projectId)
        .all();
      return rows
        .filter((r): r is typeof r & { projectId: string } => r.projectId != null)
        .map((r) => ({
          projectId: r.projectId,
          inputTokens: Number(r.inputTokens),
          outputTokens: Number(r.outputTokens),
          totalTokens: Number(r.totalTokens),
          runs: Number(r.runs),
        }));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to aggregate usage by project', { cause: error });
    }
  }
}
