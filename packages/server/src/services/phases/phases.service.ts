// Shared
import type { Phase, CreatePhase, UpdatePhase } from '@my-agents/shared';

// Repositories
import { phasesRepository } from '../../db/repositories/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

const FILE_PATH = 'services/phases/phases.service.ts';

export class PhasesService {
  constructor(private readonly repo = phasesRepository) {}

  /** Returns all phases for a project. */
  async list(projectId: string): Promise<Phase[]> {
    const FUNCTION_NAME = 'list';
    try {
      return this.repo.findByProjectId(projectId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list phases', { cause: error });
    }
  }

  /** Returns a phase by ID. */
  async getById(id: string): Promise<Phase> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get phase', { cause: error });
    }
  }

  /** Creates a new phase. Auto-assigns orderIndex if not provided. */
  async create(data: CreatePhase): Promise<Phase> {
    const FUNCTION_NAME = 'create';
    try {
      // Auto-set orderIndex to end of list if not provided
      if (data.orderIndex === undefined || data.orderIndex === 0) {
        const existing = this.repo.findByProjectId(data.projectId);
        const maxIndex = existing.reduce((max, p) => Math.max(max, p.orderIndex), -1);
        data = { ...data, orderIndex: maxIndex + 1 };
      }
      return this.repo.insert(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create phase', { cause: error });
    }
  }

  /** Updates a phase by ID. */
  async update(id: string, data: UpdatePhase): Promise<Phase> {
    const FUNCTION_NAME = 'update';
    try {
      return this.repo.update(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update phase', { cause: error });
    }
  }

  /** Deletes a phase by ID. */
  async delete(id: string): Promise<void> {
    const FUNCTION_NAME = 'delete';
    try {
      this.repo.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete phase', { cause: error });
    }
  }

  /** Computes task completion progress for a phase (total, done, percent). */
  getProgress(phase: Phase): { total: number; done: number; percent: number } {
    const total = phase.taskCount ?? 0;
    const done = phase.doneCount ?? 0;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, percent };
  }
}
