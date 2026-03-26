// Shared
import type { Review, ChecklistItem } from '@atlas/shared';

// Services
import { activityLogService } from '../index.js';

// Repositories
import { reviewsRepository, tasksRepository } from '../../db/repositories/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

const FILE_PATH = 'services/reviews/reviews.service.ts';

export class ReviewsService {
  constructor(private readonly repo = reviewsRepository) {}

  /** Returns the review for a task, or null if none exists. */
  async getByTask(taskId: string): Promise<Review | null> {
    const FUNCTION_NAME = 'getByTask';
    try {
      return this.repo.findByTaskId(taskId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get review', { cause: error });
    }
  }

  /** Returns a review by ID. */
  async getById(id: string): Promise<Review> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get review', { cause: error });
    }
  }

  /** Creates a review for a task, parsing its definition of done into checklist items. */
  async createForTask(taskId: string): Promise<Review> {
    const FUNCTION_NAME = 'createForTask';
    try {
      // Check if review already exists
      const existing = this.repo.findByTaskId(taskId);
      if (existing && existing.status === 'pending') {
        return existing;
      }

      const task = tasksRepository.findByIdOrThrow(taskId);

      // Parse DoD into checklist items
      const checklist: ChecklistItem[] = (task.definitionOfDone ?? '')
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean)
        .map((item: string) => ({ item, checked: false }));

      const review = this.repo.insert({
        taskId,
        checklist: checklist.length > 0 ? checklist : null,
        reviewerType: 'human',
      });

      activityLogService.log({
        projectId: task.projectId,
        taskId,
        eventType: 'review_created',
        description: `Review created for task: ${task.name}`,
        metadata: { reviewId: review.id },
      });

      return review;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create review', { cause: error });
    }
  }

  /** Updates a review's checklist or notes. */
  async update(id: string, data: {
    checklist?: ChecklistItem[] | null;
    notes?: string | null;
  }): Promise<Review> {
    const FUNCTION_NAME = 'update';
    try {
      return this.repo.update(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update review', { cause: error });
    }
  }

  /** Records an approval or change-request decision and updates task status accordingly. */
  async decide(
    id: string,
    decision: 'approved' | 'changes_requested',
    notes?: string | null,
  ): Promise<Review> {
    const FUNCTION_NAME = 'decide';
    try {
      const review = this.repo.findByIdOrThrow(id);
      const task = tasksRepository.findByIdOrThrow(review.taskId);

      const updated = this.repo.update(id, {
        status: decision,
        notes: notes ?? null,
        decidedAt: new Date().toISOString(),
      });

      // Transition task based on decision
      const newStatus = decision === 'approved' ? 'Done' : 'In Progress';
      tasksRepository.update(review.taskId, { status: newStatus });

      activityLogService.log({
        projectId: task.projectId,
        taskId: review.taskId,
        eventType: 'review_decided',
        description: `Review ${decision === 'approved' ? 'approved' : 'changes requested'} for task: ${task.name}`,
        metadata: { reviewId: id, decision },
      });

      return updated;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to decide review', { cause: error });
    }
  }

  /** Submits an AI agent's review with checklist updates, then records the decision. */
  async submitAiReview(id: string, data: {
    decision: 'approved' | 'changes_requested';
    notes?: string | null;
    checklistUpdates?: { item: string; checked: boolean }[];
    agentId?: string;
  }): Promise<Review> {
    const FUNCTION_NAME = 'submitAiReview';
    try {
      const review = this.repo.findByIdOrThrow(id);

      let checklist = review.checklist;
      if (data.checklistUpdates && checklist) {
        checklist = checklist.map((c) => {
          const update = data.checklistUpdates!.find((u) => u.item === c.item);
          return update ? { ...c, checked: update.checked } : c;
        });
      }

      this.repo.update(id, {
        checklist,
        reviewerId: data.agentId ?? null,
        reviewerType: 'agent',
      });

      return await this.decide(id, data.decision, data.notes);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to submit AI review', { cause: error });
    }
  }
}
