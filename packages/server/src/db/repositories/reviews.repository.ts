// External
import { eq } from 'drizzle-orm';

// Shared
import type { Review, ChecklistItem } from '@my-agents/shared';

// DB
import type { DB } from '../index.js';
import { reviews } from '../schema/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';

const FILE_PATH = 'db/repositories/reviews.repository.ts';

type ReviewRow = Omit<Review, 'checklist'> & { checklist: string | null };

function parseReview(row: ReviewRow): Review {
  return {
    ...row,
    checklist: row.checklist ? (JSON.parse(row.checklist) as ChecklistItem[]) : null,
  };
}

export class ReviewsRepository {
  constructor(private readonly db: DB) {}

  /** Returns the review for a task with checklist JSON parsed, or null. */
  findByTaskId(taskId: string): Review | null {
    const FUNCTION_NAME = 'findByTaskId';
    try {
      const row = this.db.select().from(reviews).where(eq(reviews.taskId, taskId)).get();
      return row ? parseReview(row as ReviewRow) : null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query review', { cause: error });
    }
  }

  /** Returns all pending reviews with checklist JSON parsed. */
  findPending(): Review[] {
    const FUNCTION_NAME = 'findPending';
    try {
      const rows = this.db.select().from(reviews).where(eq(reviews.status, 'pending')).all();
      return rows.map((r) => parseReview(r as ReviewRow));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query pending reviews', { cause: error });
    }
  }

  /** Returns a review by ID with checklist JSON parsed, or null if not found. */
  findById(id: string): Review | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(reviews).where(eq(reviews.id, id)).get();
      return row ? parseReview(row as ReviewRow) : null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query review', { cause: error });
    }
  }

  /** Returns a review by ID with checklist JSON parsed, or throws NotFoundError. */
  findByIdOrThrow(id: string): Review {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('Review', id);
    }
    return row;
  }

  /** Inserts a new review with checklist serialized to JSON. */
  insert(data: {
    taskId: string;
    checklist: ChecklistItem[] | null;
    reviewerType?: string;
    reviewerId?: string | null;
  }): Review {
    const FUNCTION_NAME = 'insert';
    try {
      const result = this.db
        .insert(reviews)
        .values({
          taskId: data.taskId,
          reviewerId: data.reviewerId ?? null,
          reviewerType: data.reviewerType ?? 'human',
          checklist: data.checklist ? JSON.stringify(data.checklist) : null,
        })
        .returning()
        .get();
      return parseReview(result as ReviewRow);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert review', { cause: error });
    }
  }

  /** Deletes all reviews for a task. */
  removeByTaskId(taskId: string): void {
    try {
      this.db.delete(reviews).where(eq(reviews.taskId, taskId)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: removeByTaskId`, error);
      throw new AppError('Failed to delete reviews for task', { cause: error });
    }
  }

  /** Updates a review with selective field updates and returns the updated record. */
  update(id: string, data: {
    checklist?: ChecklistItem[] | null;
    notes?: string | null;
    status?: string;
    reviewerId?: string | null;
    reviewerType?: string;
    decidedAt?: string | null;
  }): Review {
    const FUNCTION_NAME = 'update';
    try {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (data.checklist !== undefined) {
        updateData.checklist = data.checklist ? JSON.stringify(data.checklist) : null;
      }
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.reviewerId !== undefined) updateData.reviewerId = data.reviewerId;
      if (data.reviewerType !== undefined) updateData.reviewerType = data.reviewerType;
      if (data.decidedAt !== undefined) updateData.decidedAt = data.decidedAt;

      const result = this.db
        .update(reviews)
        .set(updateData)
        .where(eq(reviews.id, id))
        .returning()
        .get();
      return parseReview(result as ReviewRow);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update review', { cause: error });
    }
  }
}
