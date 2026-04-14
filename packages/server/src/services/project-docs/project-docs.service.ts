// Shared
import type { CreateProjectDoc, DocType, ProjectDoc, UpdateProjectDoc } from '@atlas/shared';

// Repositories
import { projectDocsRepository } from '../../db/repositories/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/project-docs/project-docs.service.ts';

export class ProjectDocsService {
  /** Lists all docs across all projects. */
  async listAll(): Promise<ProjectDoc[]> {
    const FUNCTION_NAME = 'listAll';
    try {
      return projectDocsRepository.findAll();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list all project docs', { cause: error });
    }
  }

  /** Lists all docs for a project. */
  async list(projectId: string): Promise<ProjectDoc[]> {
    const FUNCTION_NAME = 'list';
    try {
      return projectDocsRepository.findByProjectId(projectId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list project docs', { cause: error });
    }
  }

  /** Returns a single doc by ID. */
  async getById(id: string): Promise<ProjectDoc> {
    const FUNCTION_NAME = 'getById';
    try {
      return projectDocsRepository.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get project doc', { cause: error });
    }
  }

  /** Creates a new custom doc for a project. */
  async create(projectId: string, data: CreateProjectDoc): Promise<ProjectDoc> {
    const FUNCTION_NAME = 'create';
    try {
      return projectDocsRepository.insert({
        projectId,
        title: data.title,
        type: data.type ?? 'custom',
        content: data.content ?? '',
        source: 'user',
      });
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create project doc', { cause: error });
    }
  }

  /** Updates an existing doc's title and/or content. */
  async update(id: string, data: UpdateProjectDoc): Promise<ProjectDoc> {
    const FUNCTION_NAME = 'update';
    try {
      return projectDocsRepository.update(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update project doc', { cause: error });
    }
  }

  /** Deletes a doc by ID. */
  async remove(id: string): Promise<void> {
    const FUNCTION_NAME = 'remove';
    try {
      projectDocsRepository.findByIdOrThrow(id);
      projectDocsRepository.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete project doc', { cause: error });
    }
  }

  /**
   * Creates or replaces an AI-generated doc of a given type.
   * Only one AI-generated doc per type per project is kept.
   */
  async saveGenerated(projectId: string, type: DocType, title: string, content: string): Promise<ProjectDoc> {
    const FUNCTION_NAME = 'saveGenerated';
    try {
      return projectDocsRepository.upsertGenerated(projectId, type, title, content);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to save generated doc', { cause: error });
    }
  }

  /**
   * Saves an approved plan as a doc. Creates a new doc each time
   * (plans accumulate — history is preserved, not overwritten).
   */
  async savePlan(projectId: string, taskName: string, markdown: string): Promise<ProjectDoc> {
    const FUNCTION_NAME = 'savePlan';
    try {
      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - saving plan doc for task "${taskName}"`);
      return projectDocsRepository.insert({
        projectId,
        title: `Plan: ${taskName}`,
        type: 'plan',
        content: markdown,
        source: 'ai',
        generatedAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to save plan doc', { cause: error });
    }
  }
}
