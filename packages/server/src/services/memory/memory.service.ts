// Shared
import type { Memory, CreateMemory, UpdateMemory } from '@atlas/shared';

// Repositories
import { memoryRepository } from '../../db/repositories/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

const FILE_PATH = 'services/memory/memory.service.ts';

export class MemoryService {
  constructor(private readonly repo = memoryRepository) {}

  /**
   * Lists memory entries, optionally filtered by type, scope, or projectId.
   */
  async list(filters?: { type?: string; scope?: string; projectId?: string; agentId?: string }): Promise<Memory[]> {
    const FUNCTION_NAME = 'list';
    try {
      if (filters?.projectId) {
        const projectMemories = this.repo.findByProject(filters.projectId);
        return this.applyFilters(projectMemories, filters);
      }
      const all = this.repo.findAll();
      return this.applyFilters(all, filters);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list memory', { cause: error });
    }
  }

  private applyFilters(
    memories: Memory[],
    filters?: { type?: string; scope?: string; agentId?: string },
  ): Memory[] {
    let result = memories;
    if (filters?.type) {
      result = result.filter((m) => m.type === filters.type);
    }
    if (filters?.scope) {
      result = result.filter((m) => m.scope === filters.scope);
    }
    if (filters?.agentId) {
      result = result.filter((m) => m.agentId === filters.agentId);
    }
    return result;
  }

  /** Lists all memories relevant to a project (project-scoped + global). */
  async listByProject(projectId: string): Promise<Memory[]> {
    const FUNCTION_NAME = 'listByProject';
    try {
      return this.repo.findByProject(projectId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list memory by project', { cause: error });
    }
  }

  /** Returns a memory entry by ID. */
  async getById(id: string): Promise<Memory> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get memory', { cause: error });
    }
  }

  /** Creates a new memory entry. */
  async create(data: CreateMemory): Promise<Memory> {
    const FUNCTION_NAME = 'create';
    try {
      return this.repo.insert(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create memory', { cause: error });
    }
  }

  /** Updates a memory entry by ID. */
  async update(id: string, data: UpdateMemory): Promise<Memory> {
    const FUNCTION_NAME = 'update';
    try {
      return this.repo.update(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update memory', { cause: error });
    }
  }

  /** Deletes a memory entry by ID. */
  async delete(id: string): Promise<void> {
    const FUNCTION_NAME = 'delete';
    try {
      this.repo.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete memory', { cause: error });
    }
  }
}
