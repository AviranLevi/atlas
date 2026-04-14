// External
import { and, eq } from 'drizzle-orm';

// Shared
import type { CreateProjectDoc, ProjectDoc, UpdateProjectDoc } from '@atlas/shared';

// DB
import type { DB } from '../index.js';
import { projectDocs } from '../schema/index.js';

// Lib
import { AppError, NotFoundError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'db/repositories/project-docs.repository.ts';

type InsertProjectDoc = {
  projectId: string;
  title: string;
  type?: string;
  content?: string;
  source?: string;
  generatedAt?: string | null;
};

export class ProjectDocsRepository {
  constructor(private readonly db: DB) {}

  /** Returns all docs across all projects. */
  findAll(): ProjectDoc[] {
    const FUNCTION_NAME = 'findAll';
    try {
      return this.db.select().from(projectDocs).all() as ProjectDoc[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query all project docs', { cause: error });
    }
  }

  /** Returns all docs for a project. */
  findByProjectId(projectId: string): ProjectDoc[] {
    const FUNCTION_NAME = 'findByProjectId';
    try {
      return this.db
        .select()
        .from(projectDocs)
        .where(eq(projectDocs.projectId, projectId))
        .all() as ProjectDoc[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query project docs', { cause: error });
    }
  }

  /** Returns docs for a project filtered by type. */
  findByProjectIdAndType(projectId: string, type: string): ProjectDoc[] {
    const FUNCTION_NAME = 'findByProjectIdAndType';
    try {
      return this.db
        .select()
        .from(projectDocs)
        .where(and(eq(projectDocs.projectId, projectId), eq(projectDocs.type, type)))
        .all() as ProjectDoc[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query project docs by type', { cause: error });
    }
  }

  /** Returns a single doc by ID, or null if not found. */
  findById(id: string): ProjectDoc | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(projectDocs).where(eq(projectDocs.id, id)).get();
      return (row as ProjectDoc) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query project doc', { cause: error });
    }
  }

  /** Returns a single doc by ID, or throws NotFoundError. */
  findByIdOrThrow(id: string): ProjectDoc {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('ProjectDoc', id);
    }
    return row;
  }

  /** Inserts a new project doc and returns the created record. */
  insert(data: InsertProjectDoc): ProjectDoc {
    const FUNCTION_NAME = 'insert';
    try {
      const result = this.db.insert(projectDocs).values(data).returning().get();
      return result as ProjectDoc;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert project doc', { cause: error });
    }
  }

  /** Updates an existing project doc. */
  update(id: string, data: Partial<Pick<InsertProjectDoc, 'title' | 'content' | 'generatedAt'>>): ProjectDoc {
    const FUNCTION_NAME = 'update';
    try {
      const result = this.db
        .update(projectDocs)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(projectDocs.id, id))
        .returning()
        .get();
      if (!result) {
        throw new NotFoundError('ProjectDoc', id);
      }
      return result as ProjectDoc;
    } catch (error: unknown) {
      if (error instanceof NotFoundError) throw error;
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update project doc', { cause: error });
    }
  }

  /**
   * Inserts or updates the single AI-generated doc for a given type.
   * Filters by source='ai' to avoid colliding with user-created docs.
   */
  upsertGenerated(projectId: string, type: string, title: string, content: string): ProjectDoc {
    const FUNCTION_NAME = 'upsertGenerated';
    try {
      const existing = this.db
        .select()
        .from(projectDocs)
        .where(
          and(
            eq(projectDocs.projectId, projectId),
            eq(projectDocs.type, type),
            eq(projectDocs.source, 'ai'),
          ),
        )
        .get();

      const now = new Date().toISOString();

      if (existing) {
        return this.update(existing.id, { title, content, generatedAt: now });
      }
      return this.insert({
        projectId,
        title,
        type,
        content,
        source: 'ai',
        generatedAt: now,
      });
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to upsert generated doc', { cause: error });
    }
  }

  /** Deletes a single doc by ID. */
  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(projectDocs).where(eq(projectDocs.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete project doc', { cause: error });
    }
  }

  /** Deletes all docs for a project. */
  removeByProjectId(projectId: string): void {
    const FUNCTION_NAME = 'removeByProjectId';
    try {
      this.db.delete(projectDocs).where(eq(projectDocs.projectId, projectId)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete project docs', { cause: error });
    }
  }
}
