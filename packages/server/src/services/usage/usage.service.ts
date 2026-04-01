// Shared
import type { UsageLog, UsageSummary, UsageSummaryItem } from '@atlas/shared';

// Services
import { agentsService, projectsService } from '../index.js';

// Repositories
import { usageRepository } from '../../db/repositories/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/usage/usage.service.ts';

function resolveSince(period?: string): string | undefined {
  if (!period || period === 'all') return undefined;
  const now = Date.now();
  if (period === '7d') return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (period === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  return undefined;
}

function emptyTotals(): UsageSummary['totals'] {
  return { inputTokens: 0, outputTokens: 0, totalTokens: 0, runs: 0 };
}

export class UsageService {
  private readonly repo = usageRepository;

  /** Persists token usage for a chat or tool round. */
  log(data: {
    conversationId?: string;
    agentId?: string;
    taskId?: string;
    projectId?: string;
    workspaceId?: string;
    inputTokens: number;
    outputTokens: number;
    model?: string;
    providerType?: string;
  }): void {
    const FUNCTION_NAME = 'log';
    try {
      const inputTokens = data.inputTokens;
      const outputTokens = data.outputTokens;
      const totalTokens = inputTokens + outputTokens;
      this.repo.insert({
        conversationId: data.conversationId,
        agentId: data.agentId,
        taskId: data.taskId,
        projectId: data.projectId,
        workspaceId: data.workspaceId,
        inputTokens,
        outputTokens,
        totalTokens,
        model: data.model,
        providerType: data.providerType,
      });
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to log usage', { cause: error });
    }
  }

  /** Returns aggregated usage grouped by agent or project with display names. */
  async getSummary(groupBy: 'agent' | 'project', period?: string, projectId?: string): Promise<UsageSummary> {
    const FUNCTION_NAME = 'getSummary';
    try {
      const since = resolveSince(period);
      const items: UsageSummaryItem[] = [];

      if (groupBy === 'agent') {
        const rows = this.repo.getSummaryByAgent(since, projectId);
        for (const r of rows) {
          let name = r.agentId;
          try {
            const agent = await agentsService.getById(r.agentId);
            name = agent.name;
          } catch {
            name = r.agentId;
          }
          items.push({
            id: r.agentId,
            name,
            inputTokens: r.inputTokens,
            outputTokens: r.outputTokens,
            totalTokens: r.totalTokens,
            runs: r.runs,
          });
        }
      } else {
        const rows = this.repo.getSummaryByProject(since, projectId);
        for (const r of rows) {
          let name = r.projectId;
          try {
            const project = await projectsService.getById(r.projectId);
            name = project.name;
          } catch {
            name = r.projectId;
          }
          items.push({
            id: r.projectId,
            name,
            inputTokens: r.inputTokens,
            outputTokens: r.outputTokens,
            totalTokens: r.totalTokens,
            runs: r.runs,
          });
        }
      }

      const totals = items.reduce(
        (acc, it) => ({
          inputTokens: acc.inputTokens + it.inputTokens,
          outputTokens: acc.outputTokens + it.outputTokens,
          totalTokens: acc.totalTokens + it.totalTokens,
          runs: acc.runs + it.runs,
        }),
        emptyTotals(),
      );

      return { items, totals };
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get usage summary', { cause: error });
    }
  }

  /** Sums token counts for all logs in a conversation. */
  async getConversationUsage(
    conversationId: string,
  ): Promise<{ inputTokens: number; outputTokens: number; totalTokens: number }> {
    const FUNCTION_NAME = 'getConversationUsage';
    try {
      const logs = this.repo.findByConversation(conversationId);
      return logs.reduce(
        (acc: { inputTokens: number; outputTokens: number; totalTokens: number }, row: UsageLog) => ({
          inputTokens: acc.inputTokens + row.inputTokens,
          outputTokens: acc.outputTokens + row.outputTokens,
          totalTokens: acc.totalTokens + row.totalTokens,
        }),
        { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      );
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get conversation usage', { cause: error });
    }
  }
}
