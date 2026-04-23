// Shared
import type { WorkspaceStatus } from '@atlas/shared';

// Under test
import type { WorkspaceBucket } from '../../src/pages/workspaces/workspaces.constants';

/**
 * Parameterized row for `bucketOfWorkspace` tests.
 *
 * `completed` differs by stage (brainstorm/plan → awaitingApproval,
 * execute/null → needsReview); every other status collapses to the same
 * bucket regardless of stage. Modelling the expectation per-stage keeps
 * that asymmetry explicit in the fixture rather than hiding it in
 * branching test logic.
 */
export type BucketRow = {
  status: WorkspaceStatus;
  byStage: Record<'brainstorm' | 'plan' | 'execute' | 'null', WorkspaceBucket>;
};
