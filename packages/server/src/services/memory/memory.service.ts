// Shared
import type { CreateMemory, Memory, UpdateMemory } from '@atlas/shared';

// Services
import { briefGeneratorService, supermemoryService } from '../index.js';

// Repositories
import { memoryRepository } from '../../db/repositories/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

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

  private applyFilters(memories: Memory[], filters?: { type?: string; scope?: string; agentId?: string }): Memory[] {
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

  /** Creates a new memory entry and triggers a non-blocking brief refresh if project-scoped. If supersedesId is provided, the old memory is marked as superseded. */
  async create(data: CreateMemory): Promise<Memory> {
    const FUNCTION_NAME = 'create';
    try {
      const { supersedesId, ...insertData } = data;
      const mem = this.repo.insert(insertData);
      if (supersedesId) {
        this.repo.supersede(supersedesId, mem.id);
      }
      if (data.projectId) {
        briefGeneratorService.generateAndSave(data.projectId).catch((err: unknown) => {
          logger.error(`${FILE_PATH} :: create - brief generation failed`, err);
        });
      }
      supermemoryService.syncMemory(mem).catch(() => {});
      return mem;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create memory', { cause: error });
    }
  }

  /** Marks a memory as superseded by a new memory. Optionally creates the replacement in one step. */
  async supersede(id: string, replacement?: { name: string; content: string; type: string }): Promise<Memory> {
    const FUNCTION_NAME = 'supersede';
    try {
      const existing = this.repo.findByIdOrThrow(id);
      if (replacement) {
        const newMem = this.repo.insert({
          name: replacement.name,
          content: replacement.content,
          type: replacement.type as NonNullable<Memory['type']>,
          scope: existing.scope ?? 'project',
          projectId: existing.projectId ?? undefined,
          agentId: existing.agentId ?? undefined,
        });
        this.repo.supersede(id, newMem.id);
        if (existing.projectId) {
          briefGeneratorService.generateAndSave(existing.projectId).catch((err: unknown) => {
            logger.error(`${FILE_PATH} :: supersede - brief generation failed`, err);
          });
        }
        return newMem;
      }
      return this.repo.supersede(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to supersede memory', { cause: error });
    }
  }

  /** Updates a memory entry by ID and triggers a non-blocking brief refresh if project-scoped. */
  async update(id: string, data: UpdateMemory): Promise<Memory> {
    const FUNCTION_NAME = 'update';
    try {
      const memory = this.repo.update(id, data);
      if (memory.projectId) {
        briefGeneratorService.generateAndSave(memory.projectId).catch((err: unknown) => {
          logger.error(`${FILE_PATH} :: update - brief generation failed`, err);
        });
      }
      supermemoryService.syncMemory(memory).catch(() => {});
      return memory;
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
