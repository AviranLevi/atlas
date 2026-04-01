// Shared
import type { CreateMcpServer, McpServer, UpdateMcpServer } from '@atlas/shared';

// Repositories
import { mcpServersRepository } from '../../db/repositories/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/mcp-servers/mcp-servers.service.ts';

export class McpServersService {
  constructor(private readonly repo = mcpServersRepository) {}

  /** Returns all MCP servers. */
  async list(): Promise<McpServer[]> {
    const FUNCTION_NAME = 'list';
    try {
      return this.repo.findAll();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list MCP servers', { cause: error });
    }
  }

  /** Returns enabled MCP servers. */
  async listEnabled(): Promise<McpServer[]> {
    const FUNCTION_NAME = 'listEnabled';
    try {
      return this.repo.findEnabled();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list enabled MCP servers', { cause: error });
    }
  }

  /** Returns an MCP server by ID. */
  async getById(id: string): Promise<McpServer> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get MCP server', { cause: error });
    }
  }

  /** Creates a new MCP server. */
  async create(data: CreateMcpServer): Promise<McpServer> {
    const FUNCTION_NAME = 'create';
    try {
      return this.repo.insert(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create MCP server', { cause: error });
    }
  }

  /** Updates an MCP server by ID. */
  async update(id: string, data: UpdateMcpServer): Promise<McpServer> {
    const FUNCTION_NAME = 'update';
    try {
      return this.repo.update(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update MCP server', { cause: error });
    }
  }

  /** Deletes an MCP server by ID. */
  async delete(id: string): Promise<void> {
    const FUNCTION_NAME = 'delete';
    try {
      this.repo.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete MCP server', { cause: error });
    }
  }
}
