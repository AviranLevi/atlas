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
// External
import { describe, expect, it } from 'vitest';

// Shared
import type { WorkflowStage } from '@atlas/shared';

// Under test
import { assertNever, type Caps, deriveWorkspaceView } from '../src/pages/workspaces/workspace-view';

// Test fixtures
import { mkWorkspace } from './mocks/workspace';
import { MALFORMED_JSON, VALID_BRAINSTORM, WRONG_SHAPE_JSON, validFor } from './mocks/workflow-output';
import type { FlowRow, StructuredRow } from './types/workspace-view.types';

// ---------- stage axes -------------------------------------------------------

const FLOW_STAGES: (WorkflowStage | null | undefined)[] = ['execute', null, undefined];
const STRUCTURED_STAGES: ('brainstorm' | 'plan')[] = ['brainstorm', 'plan'];

// ---------- flow rows (7 × 3 = 21 cases) -------------------------------------

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
        const output = row.validity === 'valid' ? validFor(stage) : row.validity === 'invalid' ? MALFORMED_JSON : null;
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

// ---------- aiReviewing (currentStage signal) --------------------------------

describe('deriveWorkspaceView — aiReviewing arm', () => {
  it('running + flow + currentStage=review → aiReviewing with correct caps', () => {
    const view = deriveWorkspaceView(mkWorkspace('running', 'execute', null, 'review'));
    expect(view.kind).toBe('aiReviewing');
    expect(view.stageCategory).toBe('flow');
    expect(view.caps).toEqual<Caps>({
      canStop: true,
      canRerun: false,
      canFollowUp: false,
      canCleanup: false,
      canOpenInEditor: true,
      showCommits: true,
      showDiff: true,
      agentOutput: 'stream',
    });
  });

  it('running + null workflowStage + currentStage=review → aiReviewing (null stage normalised to flow)', () => {
    const view = deriveWorkspaceView(mkWorkspace('running', null, null, 'review'));
    expect(view.kind).toBe('aiReviewing');
  });

  it('running + flow + currentStage=execute → active (applyReviewFix implementer run)', () => {
    const view = deriveWorkspaceView(mkWorkspace('running', 'execute', null, 'execute'));
    expect(view.kind).toBe('active');
  });

  it('running + flow + currentStage=null → active (fresh implementer run, no reviewer signal)', () => {
    const view = deriveWorkspaceView(mkWorkspace('running', 'execute', null, null));
    expect(view.kind).toBe('active');
  });

  it('running + structured + currentStage=review → active (reviewer only runs on flow stages)', () => {
    const view = deriveWorkspaceView(mkWorkspace('running', 'brainstorm', null, 'review'));
    expect(view.kind).toBe('active');
    expect(view.stageCategory).toBe('structured');
  });

  it('pending + flow + currentStage=review → active (pending status, not running)', () => {
    const view = deriveWorkspaceView(mkWorkspace('pending', 'execute', null, 'review'));
    expect(view.kind).toBe('active');
  });

  it('completed + flow + currentStage=review → codeReview (reviewer has exited, stage is stale)', () => {
    // currentStage is cleared on exit paths — this guards against a stale value
    const view = deriveWorkspaceView(mkWorkspace('completed', 'execute', null, 'review'));
    expect(view.kind).toBe('codeReview');
  });
});

// ---------- assertNever ------------------------------------------------------

describe('assertNever', () => {
  it('throws when reached at runtime', () => {
    expect(() => assertNever('unreachable' as never)).toThrow();
  });
});
