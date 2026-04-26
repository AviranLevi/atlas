// Barrel module — workspace hooks are split across query, mutation, and
// log-stream files for maintainability. Importers continue to pull everything
// from `use-workspaces.hook` to avoid a sweeping import rewrite.

export type { DiffFile, DiffResult } from '@/components/workspaces/workspaces.types';

export {
  useActiveWorkspaceForTask,
  useAgentRuntimes,
  useWorkspaceCommits,
  useWorkspaceDiff,
  useWorkspaceLineage,
  useWorkspaceStatus,
  useWorkspaces,
} from '@/hooks/use-workspaces-queries.hook';

export {
  useAddDiffComment,
  useAdvanceWorkflow,
  useApplyReviewFix,
  useCleanupWorkspace,
  useCompleteWorkspace,
  useCreatePR,
  useEditDiffComment,
  useMergeWorkspace,
  useOpenWorkspaceInEditor,
  useRefreshRuntimes,
  useRejectWorkflow,
  useRemoveDiffComment,
  useRequestChanges,
  useRerunWorkspace,
  useRevertWorkspaceCommit,
  useStartAiReview,
  useStartWork,
  useStopWork,
} from '@/hooks/use-workspaces-mutations.hook';

export { useWorkspaceLogStream } from '@/hooks/use-workspace-log-stream.hook';
