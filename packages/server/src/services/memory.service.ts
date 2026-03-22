import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';
import { memoryRepository } from '../db/repositories/index.js';
import type { Memory, CreateMemory, UpdateMemory } from '@my-agents/shared';

const FILE_PATH = 'services/memory.service.ts';

export class MemoryService {
  constructor(private readonly repo = memoryRepository) {}

  /**
   * Retrieves memory entries with optional filters.
   */
  async list(filters?: { type?: string; scope?: string; projectId?: string }): Promise<Memory[]> {
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
    filters?: { type?: string; scope?: string },
  ): Memory[] {
    let result = memories;
    if (filters?.type) {
      result = result.filter((m) => m.type === filters.type);
    }
    if (filters?.scope) {
      result = result.filter((m) => m.scope === filters.scope);
    }
    return result;
  }

  /**
   * Retrieves all memories relevant to a project (project-scoped + global).
   */
  async listByProject(projectId: string): Promise<Memory[]> {
    const FUNCTION_NAME = 'listByProject';
    try {
      return this.repo.findByProject(projectId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list memory by project', { cause: error });
    }
  }

  /**
   * Retrieves a memory entry by ID.
   * @param id - The memory UUID.
   */
  async getById(id: string): Promise<Memory> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get memory', { cause: error });
    }
  }

  /**
   * Creates a new memory entry.
   * @param data - The memory creation data.
   */
  async create(data: CreateMemory): Promise<Memory> {
    const FUNCTION_NAME = 'create';
    try {
      return this.repo.insert(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create memory', { cause: error });
    }
  }

  /**
   * Updates a memory entry by ID.
   * @param id - The memory UUID.
   * @param data - The partial update data.
   */
  async update(id: string, data: UpdateMemory): Promise<Memory> {
    const FUNCTION_NAME = 'update';
    try {
      return this.repo.update(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update memory', { cause: error });
    }
  }

  /**
   * Deletes a memory entry by ID.
   * @param id - The memory UUID.
   */
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
