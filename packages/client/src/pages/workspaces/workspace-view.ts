// Shared
import type { Workspace, WorkflowOutput, WorkflowStage } from '@atlas/shared';

// Lib
import { tryParseWorkflowOutput } from '@/lib/workflow-output';

/**
 * Re-export so every consumer that needs to parse a workspace's structured
 * output goes through a single symbol. Invariant: `tryParseWorkflowOutput`
 * MUST remain synchronous and pure. If that ever changes, the purity claim
 * of `deriveWorkspaceView` breaks with it.
 */
export { tryParseWorkflowOutput };

/**
 * A workspace's workflowStage is one of 'brainstorm' | 'plan' | 'execute' |
 * null | undefined. We collapse the last three into 'flow' because they share
 * identical rendering rules; 'brainstorm' and 'plan' share the "structured"
 * rules (JSON artifact, approval gate, read-only structured view).
 */
export type StageCategory = 'flow' | 'structured';

/**
 * How — and whether — the agent's textual output should be rendered in the
 * body of the detail page.
 *   - 'stream'              live tail while the agent runs
 *   - 'persisted'           show the stored output, expanded by default
 *   - 'persisted-collapsed' show the stored output, collapsed by default
 *   - 'none'                suppressed (structured view is rendering instead)
 */
export type AgentOutputMode = 'stream' | 'persisted' | 'persisted-collapsed' | 'none';

export type Caps = {
  canStop: boolean;
  canRerun: boolean;
  canFollowUp: boolean;
  canCleanup: boolean;
  canOpenInEditor: boolean;
  showCommits: boolean;
  showDiff: boolean;
  agentOutput: AgentOutputMode;
};

/**
 * Discriminated union of every rendering shape the workspace detail page
 * needs to produce. Each arm is constructed in exactly one place by
 * `deriveWorkspaceView`; renderers switch on `kind` and get compile-time
 * exhaustiveness via `assertNever` in the default arm.
 */
export type WorkspaceView =
  | { kind: 'active'; stageCategory: StageCategory; caps: Caps }
  | {
      kind: 'awaitingApproval';
      stageCategory: 'structured';
      stage: 'brainstorm' | 'plan';
      structured: WorkflowOutput | null;
      caps: Caps;
    }
  | {
      kind: 'structuredReview';
      stageCategory: 'structured';
      stage: 'brainstorm' | 'plan';
      structured: WorkflowOutput;
      caps: Caps;
    }
  | {
      kind: 'codeReview';
      stageCategory: 'flow';
      status: 'completed' | 'approved';
      caps: Caps;
    }
  | { kind: 'merged'; stageCategory: 'flow'; caps: Caps }
  | {
      kind: 'terminal';
      stageCategory: 'flow';
      status: 'failed' | 'stopped';
      caps: Caps;
    }
  | {
      kind: 'rawOutput';
      stageCategory: 'structured';
      status: 'approved' | 'merged' | 'failed' | 'stopped';
      caps: Caps;
    };

export function assertNever(x: never): never {
  throw new Error(`Unhandled workspace view: ${JSON.stringify(x)}`);
}

function stageCategoryOf(stage: WorkflowStage | null | undefined): StageCategory {
  return stage === 'brainstorm' || stage === 'plan' ? 'structured' : 'flow';
}

/**
 * Pure function: given a Workspace, produce the single WorkspaceView that
 * describes how the detail page should render it.
 *
 * Behaviour is pinned by the Mapping Table and Capabilities Table in the
 * plan doc; the tests in `packages/client/tests/workspace-view.test.ts`
 * mirror those tables row-for-row.
 */
export function deriveWorkspaceView(workspace: Workspace): WorkspaceView {
  const status = workspace.status;
  const stage = workspace.workflowStage ?? null;
  const stageCategory = stageCategoryOf(stage);

  // --- active: running or pending, any stage --------------------------------
  if (status === 'running' || status === 'pending') {
    return {
      kind: 'active',
      stageCategory,
      caps: {
        canStop: true,
        canRerun: false,
        canFollowUp: false,
        canCleanup: false,
        canOpenInEditor: true,
        showCommits: stageCategory === 'flow',
        showDiff: false,
        agentOutput: 'stream',
      },
    };
  }

  // --- structured stages (brainstorm | plan) --------------------------------
  if (stageCategory === 'structured') {
    const stageLit = stage as 'brainstorm' | 'plan';
    const structured = tryParseWorkflowOutput(workspace.output);

    if (status === 'completed') {
      return {
        kind: 'awaitingApproval',
        stageCategory: 'structured',
        stage: stageLit,
        structured,
        caps: {
          canStop: false,
          canRerun: true,
          canFollowUp: false,
          canCleanup: true,
          canOpenInEditor: true,
          showCommits: false,
          showDiff: false,
          // When the structured JSON is invalid, WorkflowApprovalPanel renders
          // its own markdown fallback AND we keep the collapsed AgentOutput
          // underneath — preserves the current dual-render behaviour.
          agentOutput: structured ? 'none' : 'persisted-collapsed',
        },
      };
    }

    // Post-terminal structured statuses: approved | merged | failed | stopped
    const postStatus = status as 'approved' | 'merged' | 'failed' | 'stopped';
    const isRerunnable = postStatus === 'failed' || postStatus === 'stopped';

    if (structured) {
      return {
        kind: 'structuredReview',
        stageCategory: 'structured',
        stage: stageLit,
        structured,
        caps: {
          canStop: false,
          canRerun: isRerunnable,
          canFollowUp: false,
          canCleanup: isRerunnable,
          canOpenInEditor: true,
          showCommits: false,
          showDiff: false,
          agentOutput: 'none',
        },
      };
    }

    return {
      kind: 'rawOutput',
      stageCategory: 'structured',
      status: postStatus,
      caps: {
        canStop: false,
        canRerun: isRerunnable,
        canFollowUp: false,
        canCleanup: isRerunnable,
        canOpenInEditor: true,
        showCommits: false,
        showDiff: false,
        agentOutput: 'persisted',
      },
    };
  }

  // --- flow stages (execute | null | undefined) -----------------------------
  if (status === 'completed') {
    return {
      kind: 'codeReview',
      stageCategory: 'flow',
      status: 'completed',
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
    };
  }

  if (status === 'approved') {
    return {
      kind: 'codeReview',
      stageCategory: 'flow',
      status: 'approved',
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
    };
  }

  if (status === 'merged') {
    return {
      kind: 'merged',
      stageCategory: 'flow',
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
    };
  }

  if (status === 'failed' || status === 'stopped') {
    return {
      kind: 'terminal',
      stageCategory: 'flow',
      status,
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
    };
  }

  return assertNever(status);
}
