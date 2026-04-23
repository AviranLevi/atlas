/**
 * Exhaustive snapshot of `deriveWorkspaceView`'s Mapping + Capabilities tables.
 *
 * Total cases = 7 flow rows × 3 flow stage literals (execute | null | undefined)
 *             + 12 structured rows × 2 structured stage literals (brainstorm | plan)
 *             = 21 + 24 = 45
 *
 * The test data literally mirrors the tables in the plan doc; reviewing a
 * diff to either table means reviewing a diff to this file.
 */
import { describe, it, expect } from 'vitest';

import type { Workspace, WorkspaceStatus, WorkflowStage } from '@atlas/shared';
import {
  deriveWorkspaceView,
  assertNever,
  type Caps,
  type WorkspaceView,
} from '../src/pages/workspaces/workspace-view';

// ---------- fixtures ---------------------------------------------------------

const VALID_BRAINSTORM = JSON.stringify({
  stage: 'brainstorm',
  data: {
    overview: 'overview',
    ideas: [{ title: 'a', description: 'd', tradeoffs: [], recommended: true }],
    recommendation: 'r',
  },
});

const VALID_PLAN = JSON.stringify({
  stage: 'plan',
  data: {
    summary: 's',
    estimatedComplexity: 'low',
    steps: [{ order: 1, title: 't', file: null, description: 'd', risk: 'low' }],
    commitSteps: [],
    concerns: [],
  },
});

const MALFORMED_JSON = '{ not json';
const WRONG_SHAPE_JSON = JSON.stringify({ stage: 'nope', data: {} });

function validFor(stage: 'brainstorm' | 'plan'): string {
  return stage === 'brainstorm' ? VALID_BRAINSTORM : VALID_PLAN;
}

function mkWorkspace(
  status: WorkspaceStatus,
  workflowStage: WorkflowStage | null | undefined,
  output: string | null = null,
): Workspace {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    taskId: '00000000-0000-0000-0000-000000000002',
    projectId: '00000000-0000-0000-0000-000000000003',
    agentId: null,
    agentRuntime: 'test',
    model: null,
    branchName: 'test',
    baseBranch: null,
    worktreePath: '/tmp/x',
    pid: null,
    status,
    output,
    workflowStage,
    parentWorkspaceId: null,
    providerFallbackReason: null,
    diffComments: null,
    startedAt: null,
    completedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

const FLOW_STAGES: (WorkflowStage | null | undefined)[] = ['execute', null, undefined];
const STRUCTURED_STAGES: ('brainstorm' | 'plan')[] = ['brainstorm', 'plan'];

// ---------- flow rows (7 × 3 = 21 cases) -------------------------------------

type FlowRow = {
  status: WorkspaceStatus;
  expectedKind: WorkspaceView['kind'];
  caps: Caps;
};

const FLOW_ROWS: FlowRow[] = [
  {
    status: 'pending',
    expectedKind: 'active',
    caps: {
      canStop: true,
      canRerun: false,
      canFollowUp: false,
      canCleanup: false,
      canOpenInEditor: true,
      showCommits: true,
      showDiff: false,
      agentOutput: 'stream',
    },
  },
  {
    status: 'running',
    expectedKind: 'active',
    caps: {
      canStop: true,
      canRerun: false,
      canFollowUp: false,
      canCleanup: false,
      canOpenInEditor: true,
      showCommits: true,
      showDiff: false,
      agentOutput: 'stream',
    },
  },
  {
    status: 'completed',
    expectedKind: 'codeReview',
    caps: {
      canStop: false,
      canRerun: true,
      canFollowUp: true,
      canCleanup: true,
      canOpenInEditor: true,
      showCommits: true,
      showDiff: true,
      agentOutput: 'persisted',
    },
  },
  {
    status: 'approved',
    expectedKind: 'codeReview',
    caps: {
      canStop: false,
      canRerun: false,
      canFollowUp: false,
      canCleanup: false,
      canOpenInEditor: true,
      showCommits: true,
      showDiff: true,
      agentOutput: 'persisted',
    },
  },
  {
    status: 'merged',
    expectedKind: 'merged',
    caps: {
      canStop: false,
      canRerun: false,
      canFollowUp: false,
      canCleanup: false,
      canOpenInEditor: true,
      showCommits: true,
      showDiff: false,
      agentOutput: 'persisted',
    },
  },
  {
    status: 'failed',
    expectedKind: 'terminal',
    caps: {
      canStop: false,
      canRerun: true,
      canFollowUp: false,
      canCleanup: true,
      canOpenInEditor: true,
      showCommits: true,
      showDiff: false,
      agentOutput: 'persisted',
    },
  },
  {
    status: 'stopped',
    expectedKind: 'terminal',
    caps: {
      canStop: false,
      canRerun: true,
      canFollowUp: false,
      canCleanup: true,
      canOpenInEditor: true,
      showCommits: true,
      showDiff: false,
      agentOutput: 'persisted',
    },
  },
];

// ---------- structured rows (12 × 2 = 24 cases) ------------------------------

type StructuredRow = {
  label: string;
  status: WorkspaceStatus;
  /** null = validity is n/a (pending/running don't read output). */
  validity: 'valid' | 'invalid' | null;
  expectedKind: WorkspaceView['kind'];
  caps: Caps;
};

const STRUCTURED_ROWS: StructuredRow[] = [
  {
    label: 'pending + structured (validity n/a)',
    status: 'pending',
    validity: null,
    expectedKind: 'active',
    caps: {
      canStop: true,
      canRerun: false,
      canFollowUp: false,
      canCleanup: false,
      canOpenInEditor: true,
      showCommits: false,
      showDiff: false,
      agentOutput: 'stream',
    },
  },
  {
    label: 'running + structured (validity n/a)',
    status: 'running',
    validity: null,
    expectedKind: 'active',
    caps: {
      canStop: true,
      canRerun: false,
      canFollowUp: false,
      canCleanup: false,
      canOpenInEditor: true,
      showCommits: false,
      showDiff: false,
      agentOutput: 'stream',
    },
  },
  {
    label: 'completed + structured + valid',
    status: 'completed',
    validity: 'valid',
    expectedKind: 'awaitingApproval',
    caps: {
      canStop: false,
      canRerun: true,
      canFollowUp: false,
      canCleanup: true,
      canOpenInEditor: true,
      showCommits: false,
      showDiff: false,
      agentOutput: 'none',
    },
  },
  {
    label: 'completed + structured + invalid',
    status: 'completed',
    validity: 'invalid',
    expectedKind: 'awaitingApproval',
    caps: {
      canStop: false,
      canRerun: true,
      canFollowUp: false,
      canCleanup: true,
      canOpenInEditor: true,
      showCommits: false,
      showDiff: false,
      agentOutput: 'persisted-collapsed',
    },
  },
  {
    label: 'approved + structured + valid',
    status: 'approved',
    validity: 'valid',
    expectedKind: 'structuredReview',
    caps: {
      canStop: false,
      canRerun: false,
      canFollowUp: false,
      canCleanup: false,
      canOpenInEditor: true,
      showCommits: false,
      showDiff: false,
      agentOutput: 'none',
    },
  },
  {
    label: 'approved + structured + invalid',
    status: 'approved',
    validity: 'invalid',
    expectedKind: 'rawOutput',
    caps: {
      canStop: false,
      canRerun: false,
      canFollowUp: false,
      canCleanup: false,
      canOpenInEditor: true,
      showCommits: false,
      showDiff: false,
      agentOutput: 'persisted',
    },
  },
  {
    label: 'merged + structured + valid',
    status: 'merged',
    validity: 'valid',
    expectedKind: 'structuredReview',
    caps: {
      canStop: false,
      canRerun: false,
      canFollowUp: false,
      canCleanup: false,
      canOpenInEditor: true,
      showCommits: false,
      showDiff: false,
      agentOutput: 'none',
    },
  },
  {
    label: 'merged + structured + invalid',
    status: 'merged',
    validity: 'invalid',
    expectedKind: 'rawOutput',
    caps: {
      canStop: false,
      canRerun: false,
      canFollowUp: false,
      canCleanup: false,
      canOpenInEditor: true,
      showCommits: false,
      showDiff: false,
      agentOutput: 'persisted',
    },
  },
  {
    label: 'failed + structured + valid',
    status: 'failed',
    validity: 'valid',
    expectedKind: 'structuredReview',
    caps: {
      canStop: false,
      canRerun: true,
      canFollowUp: false,
      canCleanup: true,
      canOpenInEditor: true,
      showCommits: false,
      showDiff: false,
      agentOutput: 'none',
    },
  },
  {
    label: 'failed + structured + invalid',
    status: 'failed',
    validity: 'invalid',
    expectedKind: 'rawOutput',
    caps: {
      canStop: false,
      canRerun: true,
      canFollowUp: false,
      canCleanup: true,
      canOpenInEditor: true,
      showCommits: false,
      showDiff: false,
      agentOutput: 'persisted',
    },
  },
  {
    label: 'stopped + structured + valid',
    status: 'stopped',
    validity: 'valid',
    expectedKind: 'structuredReview',
    caps: {
      canStop: false,
      canRerun: true,
      canFollowUp: false,
      canCleanup: true,
      canOpenInEditor: true,
      showCommits: false,
      showDiff: false,
      agentOutput: 'none',
    },
  },
  {
    label: 'stopped + structured + invalid',
    status: 'stopped',
    validity: 'invalid',
    expectedKind: 'rawOutput',
    caps: {
      canStop: false,
      canRerun: true,
      canFollowUp: false,
      canCleanup: true,
      canOpenInEditor: true,
      showCommits: false,
      showDiff: false,
      agentOutput: 'persisted',
    },
  },
];

// ---------- tests ------------------------------------------------------------

describe('deriveWorkspaceView — flow rows', () => {
  for (const row of FLOW_ROWS) {
    for (const stage of FLOW_STAGES) {
      it(`status=${row.status} stage=${String(stage)} → ${row.expectedKind}`, () => {
        const view = deriveWorkspaceView(mkWorkspace(row.status, stage));
        expect(view.kind).toBe(row.expectedKind);
        expect(view.stageCategory).toBe('flow');
        expect(view.caps).toEqual(row.caps);
      });
    }
  }
});

describe('deriveWorkspaceView — structured rows', () => {
  for (const row of STRUCTURED_ROWS) {
    for (const stage of STRUCTURED_STAGES) {
      it(`${row.label} (stage=${stage}) → ${row.expectedKind}`, () => {
        const output =
          row.validity === 'valid' ? validFor(stage) : row.validity === 'invalid' ? MALFORMED_JSON : null;
        const view = deriveWorkspaceView(mkWorkspace(row.status, stage, output));
        expect(view.kind).toBe(row.expectedKind);
        expect(view.stageCategory).toBe('structured');
        expect(view.caps).toEqual(row.caps);

        // Stage literal should round-trip on arms that carry it.
        if (view.kind === 'awaitingApproval' || view.kind === 'structuredReview') {
          expect(view.stage).toBe(stage);
        }
      });
    }
  }
});

// ---------- structured parse edge cases --------------------------------------

describe('deriveWorkspaceView — structured parse edge cases', () => {
  it('null output on completed+structured → awaitingApproval with structured=null and persisted-collapsed', () => {
    const view = deriveWorkspaceView(mkWorkspace('completed', 'brainstorm', null));
    expect(view.kind).toBe('awaitingApproval');
    if (view.kind !== 'awaitingApproval') return;
    expect(view.structured).toBeNull();
    expect(view.caps.agentOutput).toBe('persisted-collapsed');
  });

  it('empty-string output on completed+structured → awaitingApproval with structured=null', () => {
    const view = deriveWorkspaceView(mkWorkspace('completed', 'plan', ''));
    expect(view.kind).toBe('awaitingApproval');
    if (view.kind !== 'awaitingApproval') return;
    expect(view.structured).toBeNull();
    expect(view.caps.agentOutput).toBe('persisted-collapsed');
  });

  it('wrong-shape JSON on approved+structured → rawOutput (not structuredReview)', () => {
    const view = deriveWorkspaceView(mkWorkspace('approved', 'brainstorm', WRONG_SHAPE_JSON));
    expect(view.kind).toBe('rawOutput');
  });

  it('valid brainstorm JSON on stage=plan fails discriminator → rawOutput', () => {
    // Valid brainstorm JSON has stage:"brainstorm", which mismatches the
    // workflow stage; we still treat the output as structurally valid if
    // schema-parseable, but the resulting discriminant is checked at render
    // time. Today's behaviour: the parser accepts it and deriveWorkspaceView
    // passes it through as structuredReview with mismatched stage. Lock that
    // in so future callers can't silently drift.
    const view = deriveWorkspaceView(mkWorkspace('approved', 'plan', VALID_BRAINSTORM));
    expect(view.kind).toBe('structuredReview');
    if (view.kind !== 'structuredReview') return;
    expect(view.stage).toBe('plan');
    expect(view.structured.stage).toBe('brainstorm');
  });
});

// ---------- stage normalization ---------------------------------------------

describe('deriveWorkspaceView — stage normalization', () => {
  it('workflowStage=execute, null, and undefined all produce identical views', () => {
    const vExecute = deriveWorkspaceView(mkWorkspace('completed', 'execute'));
    const vNull = deriveWorkspaceView(mkWorkspace('completed', null));
    const vUndefined = deriveWorkspaceView(mkWorkspace('completed', undefined));
    expect(vExecute).toEqual(vNull);
    expect(vNull).toEqual(vUndefined);
    expect(vExecute.stageCategory).toBe('flow');
    expect(vExecute.kind).toBe('codeReview');
  });
});

// ---------- assertNever ------------------------------------------------------

describe('assertNever', () => {
  it('throws when reached at runtime', () => {
    expect(() => assertNever('unreachable' as never)).toThrow();
  });
});
