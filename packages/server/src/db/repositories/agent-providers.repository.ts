// External
import { eq } from 'drizzle-orm';

// Shared
import type { AgentProvider, CreateAgentProvider, UpdateAgentProvider } from '@atlas/shared';

// DB
import type { DB } from '../index.js';
import { agentProviders, agents, chatConversations } from '../schema/index.js';

// Lib
import { AppError, NotFoundError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'db/repositories/agent-providers.repository.ts';

export class AgentProvidersRepository {
  constructor(private readonly db: DB) {}

  /** Returns all agent providers. */
  findAll(): AgentProvider[] {
    const FUNCTION_NAME = 'findAll';
    try {
      return this.db.select().from(agentProviders).all() as AgentProvider[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agent providers', { cause: error });
    }
  }

  /** Returns an agent provider by ID, or null if not found. */
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

  /** Returns an agent provider by ID, or throws NotFoundError. */
  findByIdOrThrow(id: string): AgentProvider {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('AgentProvider', id);
    }
    return row;
  }

  /** Inserts a new agent provider and returns the created record. */
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

  /** Updates an agent provider and returns the updated record. */
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

  /** Deletes an agent provider by ID, nullifying all foreign key references first. */
  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.update(agents).set({ providerId: null }).where(eq(agents.providerId, id)).run();
      this.db.update(chatConversations).set({ providerId: null }).where(eq(chatConversations.providerId, id)).run();
      this.db.delete(agentProviders).where(eq(agentProviders.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete agent provider', { cause: error });
    }
  }
}
