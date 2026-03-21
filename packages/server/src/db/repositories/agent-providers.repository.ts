import { eq } from 'drizzle-orm';
import type { DB } from '../index.js';
import { agentProviders } from '../schema/index.js';
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';
import type { AgentProvider, CreateAgentProvider, UpdateAgentProvider } from '@my-agents/shared';

const FILE_PATH = 'db/repositories/agent-providers.repository.ts';

export class AgentProvidersRepository {
  constructor(private readonly db: DB) {}

  findAll(): AgentProvider[] {
    const FUNCTION_NAME = 'findAll';
    try {
      return this.db.select().from(agentProviders).all() as AgentProvider[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agent providers', { cause: error });
    }
  }

  findById(id: string): AgentProvider | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(agentProviders).where(eq(agentProviders.id, id)).get();
      return (row as AgentProvider) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agent provider', { cause: error });
    }
  }

  findByIdOrThrow(id: string): AgentProvider {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('AgentProvider', id);
    }
    return row;
  }

  insert(data: CreateAgentProvider): AgentProvider {
    const FUNCTION_NAME = 'insert';
    try {
      const result = this.db.insert(agentProviders).values(data).returning().get();
      return result as AgentProvider;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert agent provider', { cause: error });
    }
  }

  update(id: string, data: UpdateAgentProvider): AgentProvider {
    const FUNCTION_NAME = 'update';
    try {
      const result = this.db
        .update(agentProviders)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(agentProviders.id, id))
        .returning()
        .get();
      return result as AgentProvider;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update agent provider', { cause: error });
    }
  }

  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(agentProviders).where(eq(agentProviders.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete agent provider', { cause: error });
    }
  }
}
