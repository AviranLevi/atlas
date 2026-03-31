// External
import { eq } from 'drizzle-orm';

// Shared
import type { McpServer, CreateMcpServer, UpdateMcpServer } from '@atlas/shared';

// DB
import type { DB } from '../index.js';
import { mcpServers } from '../schema/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';

const FILE_PATH = 'db/repositories/mcp-servers.repository.ts';

export class McpServersRepository {
  constructor(private readonly db: DB) {}

  /** Returns all MCP server records. */
  findAll(): McpServer[] {
    const FUNCTION_NAME = 'findAll';
    try {
      return this.db.select().from(mcpServers).all() as McpServer[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query MCP servers', { cause: error });
    }
  }

  /** Returns enabled MCP server records. */
  findEnabled(): McpServer[] {
    const FUNCTION_NAME = 'findEnabled';
    try {
      return this.db
        .select()
        .from(mcpServers)
        .where(eq(mcpServers.enabled, true))
        .all() as McpServer[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query enabled MCP servers', { cause: error });
    }
  }

  /** Returns an MCP server by ID, or null if not found. */
  findById(id: string): McpServer | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(mcpServers).where(eq(mcpServers.id, id)).get();
      return (row as McpServer) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query MCP server', { cause: error });
    }
  }

  /** Returns an MCP server by ID, or throws NotFoundError. */
  findByIdOrThrow(id: string): McpServer {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('McpServer', id);
    }
    return row;
  }

  /** Inserts a new MCP server and returns the created record. */
  insert(data: CreateMcpServer): McpServer {
    const FUNCTION_NAME = 'insert';
    try {
      const result = this.db.insert(mcpServers).values(data).returning().get();
      return result as McpServer;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert MCP server', { cause: error });
    }
  }

  /** Updates an MCP server and returns the updated record. */
  update(id: string, data: UpdateMcpServer): McpServer {
    const FUNCTION_NAME = 'update';
    try {
      const result = this.db
        .update(mcpServers)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(mcpServers.id, id))
        .returning()
        .get();
      return result as McpServer;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update MCP server', { cause: error });
    }
  }

  /** Deletes an MCP server by ID. */
  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(mcpServers).where(eq(mcpServers.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete MCP server', { cause: error });
    }
  }
}
