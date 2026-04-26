// Shared
import type { Workspace } from '@atlas/shared';

// Repositories
import { workspacesRepository } from '../../../db/repositories/index.js';

// Lib
import { AppError } from '../../../lib/errors.js';

type DiffComment = NonNullable<Workspace['diffComments']>[number] & {
  updatedAt?: string;
};

export class DiffCommentsService {
  /** Adds a review comment (or reply) to a workspace diff. */
  addDiffComment(
    workspaceId: string,
    comment: { filename: string; lineNumber: number; lineContent: string; body: string; parentId?: string },
  ): Workspace {
    const workspace = workspacesRepository.findByIdOrThrow(workspaceId);
    const existing: DiffComment[] = Array.isArray(workspace.diffComments) ? [...workspace.diffComments] : [];
    const newComment: DiffComment = {
      id: crypto.randomUUID(),
      ...comment,
      createdAt: new Date().toISOString(),
    };
    existing.push(newComment);
    return workspacesRepository.update(workspaceId, {
      diffComments: JSON.stringify(existing),
    });
  }

  /** Edits an existing diff comment in a workspace. */
  editDiffComment(workspaceId: string, commentId: string, body: string): Workspace {
    const workspace = workspacesRepository.findByIdOrThrow(workspaceId);
    const existing: DiffComment[] = Array.isArray(workspace.diffComments) ? [...workspace.diffComments] : [];
    const idx = existing.findIndex((c) => c.id === commentId);
    if (idx === -1) throw new AppError('Comment not found', { status: 404 });
    existing[idx] = { ...existing[idx], body, updatedAt: new Date().toISOString() };
    return workspacesRepository.update(workspaceId, {
      diffComments: JSON.stringify(existing),
    });
  }

  /** Removes a diff comment from a workspace. */
  removeDiffComment(workspaceId: string, commentId: string): Workspace {
    const workspace = workspacesRepository.findByIdOrThrow(workspaceId);
    const existing: DiffComment[] = Array.isArray(workspace.diffComments) ? [...workspace.diffComments] : [];
    const filtered = existing.filter((c) => c.id !== commentId);
    return workspacesRepository.update(workspaceId, {
      diffComments: JSON.stringify(filtered),
    });
  }
}

export const diffCommentsService = new DiffCommentsService();
