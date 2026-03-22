import { eq } from 'drizzle-orm';
import type { DB } from '../index.js';
import { projects } from '../schema/index.js';
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';
import type { CreateProject, UpdateProject, Project } from '@my-agents/shared';

const FILE_PATH = 'db/repositories/projects.repository.ts';

/** Parse scanData JSON from DB row */
function hydrateProject(row: Record<string, unknown>): Project {
  if (row.scanData && typeof row.scanData === 'string') {
    try {
      row.scanData = JSON.parse(row.scanData);
    } catch {
      row.scanData = null;
    }
  }
  return row as Project;
}

/** Serialize scanData to JSON string for DB */
function serializeScanData(data: Record<string, unknown>): Record<string, unknown> {
  if (data.scanData && typeof data.scanData === 'object') {
    return { ...data, scanData: JSON.stringify(data.scanData) };
  }
  return data;
}

export class ProjectsRepository {
  constructor(private readonly db: DB) {}

  findAll(): Project[] {
    const FUNCTION_NAME = 'findAll';
    try {
      const rows = this.db.select().from(projects).all();
      return rows.map((r) => hydrateProject(r as Record<string, unknown>));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query projects', { cause: error });
    }
  }

  findById(id: string): Project | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(projects).where(eq(projects.id, id)).get();
      return row ? hydrateProject(row as Record<string, unknown>) : null;
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
      const serialized = serializeScanData(data as Record<string, unknown>);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = this.db.insert(projects).values(serialized as any).returning().get();
      return hydrateProject(result as Record<string, unknown>);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert project', { cause: error });
    }
  }

  update(id: string, data: UpdateProject | Record<string, unknown>): Project {
    const FUNCTION_NAME = 'update';
    try {
      const serialized = serializeScanData({ ...data, updatedAt: new Date().toISOString() });
      const result = this.db
        .update(projects)
        .set(serialized)
        .where(eq(projects.id, id))
        .returning()
        .get();
      return hydrateProject(result as Record<string, unknown>);
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
