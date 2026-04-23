// Shared
import type { WorkspaceStatus } from '@atlas/shared';

// Under test
import type { Caps, WorkspaceView } from '../../src/pages/workspaces/workspace-view';

/**
 * Parameterized row for flow-stage test cases (execute | null | undefined).
 * Flow cases don't read `workspace.output`, so there's no validity knob.
 */
export type FlowRow = {
  status: WorkspaceStatus;
  expectedKind: WorkspaceView['kind'];
  caps: Caps;
};

/**
 * Parameterized row for structured-stage test cases (brainstorm | plan).
 * `validity` gates which output fixture is used:
 *   - 'valid'   → a stage-matching valid JSON fixture
 *   - 'invalid' → malformed JSON (JSON.parse throws)
 *   - null      → validity is n/a (pending/running don't read output)
 */
export type StructuredRow = {
  label: string;
  status: WorkspaceStatus;
  validity: 'valid' | 'invalid' | null;
  expectedKind: WorkspaceView['kind'];
  caps: Caps;
};
