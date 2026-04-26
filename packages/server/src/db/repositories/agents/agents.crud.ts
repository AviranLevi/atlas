// External
import { eq } from 'drizzle-orm';

// Shared
import type { Agent, CreateAgent, UpdateAgent } from '@atlas/shared';

// DB
import type { DB } from '../../index.js';
import { agents, globalInstructions } from '../../schema/index.js';

// Lib
import { AppError } from '../../../lib/errors.js';
import { logger } from '../../../lib/logger.js';

const FILE_PATH = 'db/repositories/agents/agents.crud.ts';

export function findAll(db: DB): Agent[] {
  const FUNCTION_NAME = 'findAll';
  try {
    return db.select().from(agents).all() as Agent[];
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query agents', { cause: error });
  }
}

export function findById(db: DB, id: string): Agent | null {
  const FUNCTION_NAME = 'findById';
  try {
    const row = db.select().from(agents).where(eq(agents.id, id)).get();
    return (row as Agent) ?? null;
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query agent', { cause: error });
  }
}

export function insert(db: DB, data: CreateAgent): Agent {
  const FUNCTION_NAME = 'insert';
  try {
    const result = db.insert(agents).values(data).returning().get();
    return result as Agent;
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to insert agent', { cause: error });
  }
}

export function update(db: DB, id: string, data: UpdateAgent): Agent {
  const FUNCTION_NAME = 'update';
  try {
    const result = db
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

export function remove(db: DB, id: string): void {
  const FUNCTION_NAME = 'remove';
  try {
    db.delete(agents).where(eq(agents.id, id)).run();
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to delete agent', { cause: error });
  }
}

export function findGlobalInstructions(db: DB): string {
  const FUNCTION_NAME = 'findGlobalInstructions';
  try {
    const rows = db.select().from(globalInstructions).all();
    return rows
      .map((r) => r.content)
      .filter(Boolean)
      .join('\n\n');
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query global instructions', { cause: error });
  }
}
