// Shared
import type { Review } from '@atlas/shared';

/**
 * Factory for a minimal `Review` fixture. Status and reviewer type are the
 * only knobs tests currently need; everything else is a stable default so
 * the fixture doesn't drag test attention away from the behaviour under
 * assertion.
 *
 * `notes` and `decidedAt` are derived from `status` because the combination
 * `pending + decidedAt` is impossible in real data and would weaken tests
 * that assert it.
 */
export function mkReview(
  status: 'pending' | 'approved' | 'changes_requested',
  reviewerType: 'agent' | 'human' = 'agent',
): Review {
  return {
    id: '00000000-0000-0000-0000-0000000000aa',
    taskId: '00000000-0000-0000-0000-000000000002',
    reviewerId: null,
    reviewerType,
    status,
    checklist: [{ item: 'tests pass', checked: false }],
    notes: status === 'changes_requested' ? 'needs work' : null,
    decidedAt: status === 'pending' ? null : '2026-01-01T00:05:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}
