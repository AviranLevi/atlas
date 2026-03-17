import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';
import { tasksRepository } from '../db/repositories/index.js';
import type { Task, CreateTask, UpdateTask } from '@my-agents/shared';

const FILE_PATH = 'services/tasks.service.ts';

export class TasksService {
  constructor(private readonly repo = tasksRepository) {}

  /**
   * Retrieves all tasks.
   */
  async list(): Promise<Task[]> {
    const FUNCTION_NAME = 'list';
    try {
      return this.repo.findAll();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list tasks', { cause: error });
    }
  }

  /**
   * Retrieves a task by ID.
   * @param id - The task UUID.
   */
  async getById(id: string): Promise<Task> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get task', { cause: error });
    }
  }

  /**
   * Creates a new task.
   * @param data - The task creation data.
   */
  async create(data: CreateTask): Promise<Task> {
    const FUNCTION_NAME = 'create';
    try {
      return this.repo.insert(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create task', { cause: error });
    }
  }

  /**
   * Updates a task by ID.
   * @param id - The task UUID.
   * @param data - The partial update data.
   */
  async update(id: string, data: UpdateTask): Promise<Task> {
    const FUNCTION_NAME = 'update';
    try {
      return this.repo.update(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update task', { cause: error });
    }
  }

  /**
   * Deletes a task by ID.
   * @param id - The task UUID.
   */
  async delete(id: string): Promise<void> {
    const FUNCTION_NAME = 'delete';
    try {
      this.repo.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete task', { cause: error });
    }
  }
}
