// External
import { eq } from 'drizzle-orm';

// Shared
import type { Agent, CreateAgent, UpdateAgent } from '@my-agents/shared';

// DB
import type { DB } from '../index.js';
import { agents } from '../schema/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';

const FILE_PATH = 'db/repositories/agents.repository.ts';

export class AgentsRepository {
  constructor(private readonly db: DB) {}

  /** Returns all agents. */
  findAll(): Agent[] {
    const FUNCTION_NAME = 'findAll';
    try {
      return this.db.select().from(agents).all() as Agent[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agents', { cause: error });
    }
  }

  /** Returns an agent by ID, or null if not found. */
  findById(id: string): Agent | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(agents).where(eq(agents.id, id)).get();
      return (row as Agent) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agent', { cause: error });
    }
  }

  /** Returns an agent by ID, or throws NotFoundError. */
  findByIdOrThrow(id: string): Agent {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('Agent', id);
    }
    return row;
  }

  /** Inserts a new agent and returns the created record. */
  insert(data: CreateAgent): Agent {
    const FUNCTION_NAME = 'insert';
    try {
      const result = this.db.insert(agents).values(data).returning().get();
      return result as Agent;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert agent', { cause: error });
    }
  }

  /** Updates an agent and returns the updated record. */
  update(id: string, data: UpdateAgent): Agent {
    const FUNCTION_NAME = 'update';
    try {
      const result = this.db
        .update(agents)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(agents.id, id))
        .returning()
        .get();
      return result as Agent;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update agent', { cause: error });
    }
  }

  /** Deletes an agent by ID. */
  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(agents).where(eq(agents.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete agent', { cause: error });
    }
  }
}
