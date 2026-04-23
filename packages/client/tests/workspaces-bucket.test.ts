/**
 * Exhaustive snapshot of `bucketOfWorkspace`.
 *
 * 7 status × 4 stages (brainstorm | plan | execute | null) = 28 cases.
 * Every workspace lands in exactly one bucket; the sum of counts equals total.
 */
// External
import { describe, expect, it } from 'vitest';

// Shared
import type { WorkflowStage } from '@atlas/shared';

// Under test
import { bucketOfWorkspace, type WorkspaceBucket } from '../src/pages/workspaces/workspaces.constants';

// Test fixtures
import { mkWorkspace } from './mocks/workspace';
import type { BucketRow } from './types/workspaces-bucket.types';

const STAGES: (WorkflowStage | null)[] = ['brainstorm', 'plan', 'execute', null];

const ROWS: BucketRow[] = [
  {
    status: 'pending',
    byStage: { brainstorm: 'active', plan: 'active', execute: 'active', null: 'active' },
  },
  {
    status: 'running',
    byStage: { brainstorm: 'active', plan: 'active', execute: 'active', null: 'active' },
  },
  {
    status: 'completed',
    byStage: {
      brainstorm: 'awaitingApproval',
      plan: 'awaitingApproval',
      execute: 'needsReview',
      null: 'needsReview',
    },
  },
  {
    status: 'approved',
    byStage: { brainstorm: 'approved', plan: 'approved', execute: 'approved', null: 'approved' },
  },
  {
    status: 'failed',
    byStage: { brainstorm: 'failed', plan: 'failed', execute: 'failed', null: 'failed' },
  },
  {
    status: 'stopped',
    byStage: { brainstorm: 'stopped', plan: 'stopped', execute: 'stopped', null: 'stopped' },
  },
  {
    status: 'merged',
    byStage: { brainstorm: 'merged', plan: 'merged', execute: 'merged', null: 'merged' },
  },
];

// Flatten to 28 parameterized cases.
const CASES = ROWS.flatMap((r) =>
  STAGES.map((s) => ({
    status: r.status,
    stage: s,
    expected: r.byStage[(s ?? 'null') as 'brainstorm' | 'plan' | 'execute' | 'null'],
  })),
);

describe('bucketOfWorkspace', () => {
  it.each(CASES)('status=$status stage=$stage → $expected', ({ status, stage, expected }) => {
    expect(bucketOfWorkspace(mkWorkspace(status, stage))).toBe(expected);
  });

  it('every case produces exactly one bucket (count sum equals total)', () => {
    const buckets: Record<WorkspaceBucket, number> = {
      active: 0,
      awaitingApproval: 0,
      needsReview: 0,
      approved: 0,
      merged: 0,
      failed: 0,
      stopped: 0,
    };
    for (const c of CASES) {
      buckets[bucketOfWorkspace(mkWorkspace(c.status, c.stage))] += 1;
    }
    const sum = Object.values(buckets).reduce((a, b) => a + b, 0);
    expect(sum).toBe(CASES.length);
    expect(CASES.length).toBe(28);
  });
});
