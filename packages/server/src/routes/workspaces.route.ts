// External
import { Hono } from 'hono';

// Shared
import {
  AddDiffCommentSchema,
  CreatePullRequestSchema,
  CreateWorkspaceSchema,
  EditDiffCommentSchema,
  RerunWorkspaceSchema,
  RevertWorkspaceSchema,
} from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  addWorkspaceComment,
  completeWorkspace,
  createWorkspace,
  createWorkspacePullRequest,
  deleteWorkspace,
  editWorkspaceComment,
  getArchivedLog,
  getWorkspace,
  getWorkspaceCommits,
  getWorkspaceDiff,
  listAgentRuntimes,
  listArchivedLogs,
  listWorkspaces,
  mergeWorkspace,
  openWorkspaceInEditor,
  refreshAgentRuntimes,
  removeWorkspaceComment,
  requestWorkspaceChanges,
  rerunWorkspace,
  revertWorkspace,
  stopWorkspace,
  advanceWorkspaceWorkflow,
  getWorkspaceLineage,
  streamWorkspaceLogs,
} from '../controllers/workspaces.controller.js';

export const workspacesRoute = new Hono()
  .get('/agent-runtimes', listAgentRuntimes)
  .post('/agent-runtimes/refresh', refreshAgentRuntimes)
  .get('/archived-logs', listArchivedLogs)
  .get('/archived-logs/:filename', getArchivedLog)
  .get('/', listWorkspaces)
  .get('/:id', getWorkspace)
  .post('/', zValidator('json', CreateWorkspaceSchema), createWorkspace)
  .get('/:id/logs/stream', streamWorkspaceLogs)
  .get('/:id/diff', getWorkspaceDiff)
  .get('/:id/commits', getWorkspaceCommits)
  .post('/:id/revert', zValidator('json', RevertWorkspaceSchema), revertWorkspace)
  .post('/:id/request-changes', requestWorkspaceChanges)
  .post('/:id/merge', mergeWorkspace)
  .post('/:id/complete', completeWorkspace)
  .post('/:id/rerun', zValidator('json', RerunWorkspaceSchema), rerunWorkspace)
  .post('/:id/create-pr', zValidator('json', CreatePullRequestSchema), createWorkspacePullRequest)
  .post('/:id/comments', zValidator('json', AddDiffCommentSchema), addWorkspaceComment)
  .post('/:id/comments/:commentId', zValidator('json', EditDiffCommentSchema), editWorkspaceComment)
  .delete('/:id/comments/:commentId', removeWorkspaceComment)
  .post('/:id/stop', stopWorkspace)
  .post('/:id/open-in-editor', openWorkspaceInEditor)
  .get('/:id/lineage', getWorkspaceLineage)
  .post('/:id/advance', advanceWorkspaceWorkflow)
  .delete('/:id', deleteWorkspace);
