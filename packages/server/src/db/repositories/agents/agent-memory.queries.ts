// External
import { eq } from 'drizzle-orm';

// DB
import type { DB } from '../../index.js';
import { memory } from '../../schema/index.js';

// Lib
import { AppError } from '../../../lib/errors.js';
import { logger } from '../../../lib/logger.js';

const FILE_PATH = 'db/repositories/agents/agent-memory.queries.ts';

export function findMemoriesByAgentId(db: DB, agentId: string): Record<string, unknown>[] {
  const FUNCTION_NAME = 'findMemoriesByAgentId';
  try {
    return db.select().from(memory).where(eq(memory.agentId, agentId)).all() as Record<string, unknown>[];
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query agent memories', { cause: error });
  }
}
