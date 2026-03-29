// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { CreateWorkspaceSchema, AddDiffCommentSchema, RerunWorkspaceSchema, CreatePullRequestSchema, EditDiffCommentSchema } from '@atlas/shared';

// Controllers
import {
  listAgentRuntimes,
  refreshAgentRuntimes,
  listArchivedLogs,
  getArchivedLog,
  listWorkspaces,
  getWorkspace,
  createWorkspace,
  getWorkspaceDiff,
  requestWorkspaceChanges,
  mergeWorkspace,
  completeWorkspace,
  rerunWorkspace,
  createWorkspacePullRequest,
  addWorkspaceComment,
  editWorkspaceComment,
  removeWorkspaceComment,
  stopWorkspace,
  deleteWorkspace,
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
  .post('/:id/request-changes', requestWorkspaceChanges)
  .post('/:id/merge', mergeWorkspace)
  .post('/:id/complete', completeWorkspace)
  .post('/:id/rerun', zValidator('json', RerunWorkspaceSchema), rerunWorkspace)
  .post('/:id/create-pr', zValidator('json', CreatePullRequestSchema), createWorkspacePullRequest)
  .post('/:id/comments', zValidator('json', AddDiffCommentSchema), addWorkspaceComment)
  .post('/:id/comments/:commentId', zValidator('json', EditDiffCommentSchema), editWorkspaceComment)
  .delete('/:id/comments/:commentId', removeWorkspaceComment)
  .post('/:id/stop', stopWorkspace)
  .delete('/:id', deleteWorkspace);
