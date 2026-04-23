// Shared
import type { Workspace, WorkspaceStatus, WorkflowStage } from '@atlas/shared';

/**
 * Factory for a minimal `Workspace` fixture. Defaults are deliberately the
 * same boring non-null values across every test so assertions stay focused
 * on the fields under test; callers override via the positional args.
 *
 * `workflowStage` accepts `undefined` so tests can cover the
 * `workflowStage` omitted/null/execute round-trip that `deriveWorkspaceView`
 * collapses to the flow category.
 */
export function mkWorkspace(
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
