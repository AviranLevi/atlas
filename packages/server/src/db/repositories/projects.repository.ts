import { eq } from 'drizzle-orm';
import type { DB } from '../index.js';
import { projects } from '../schema/index.js';
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';
import type { CreateProject, UpdateProject, Project } from '@my-agents/shared';

const FILE_PATH = 'db/repositories/projects.repository.ts';

export class ProjectsRepository {
  constructor(private readonly db: DB) {}

  findAll(): Project[] {
    const FUNCTION_NAME = 'findAll';
    try {
      return this.db.select().from(projects).all() as Project[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query projects', { cause: error });
    }
  }

  findById(id: string): Project | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(projects).where(eq(projects.id, id)).get();
      return (row as Project) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query project', { cause: error });
    }
  }

  findByIdOrThrow(id: string): Project {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('Project', id);
    }
    return row;
  }

  insert(data: CreateProject): Project {
    const FUNCTION_NAME = 'insert';
    try {
      const result = this.db.insert(projects).values(data).returning().get();
      return result as Project;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert project', { cause: error });
    }
  }

  update(id: string, data: UpdateProject): Project {
    const FUNCTION_NAME = 'update';
    try {
      const result = this.db
        .update(projects)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(projects.id, id))
        .returning()
        .get();
      return result as Project;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update project', { cause: error });
    }
  }

  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(projects).where(eq(projects.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete project', { cause: error });
    }
  }
}
