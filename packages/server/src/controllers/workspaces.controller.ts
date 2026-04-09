// External
import type { Context } from 'hono';
import fs from 'node:fs';
import path from 'node:path';
import { streamSSE } from 'hono/streaming';

// Shared
import type {
  AddDiffComment,
  CreatePullRequest,
  CreateWorkspace,
  EditDiffComment,
  RerunWorkspace,
} from '@atlas/shared';

// Executors
import { executorRegistry } from '../executors/index.js';

// Services
import { orchestratorService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';
import { logger } from '../lib/logger.js';

/** Lists all registered agent runtimes. */
export async function listAgentRuntimes(c: Context) {
  return c.json(await executorRegistry.listAll());
}

/** Refreshes the agent runtime registry and returns the updated list. */
export async function refreshAgentRuntimes(c: Context) {
  await executorRegistry.refresh();
  return c.json(await executorRegistry.listAll());
}

/** Lists filenames of archived workspace logs. */
export function listArchivedLogs(c: Context) {
  return c.json(orchestratorService.listArchivedLogs());
}

/** Returns the content of an archived workspace log file. */
export function getArchivedLog(c: Context) {
  const content = orchestratorService.getArchivedLog(c.req.param('filename')!);
  if (!content) return c.json({ error: 'Log not found' }, 404);
  return c.text(content);
}

/** Lists workspaces. Pass status=active to limit to running/pending. */
export async function listWorkspaces(c: Context) {
  const status = c.req.query('status');
  const workspaces = status === 'active' ? await orchestratorService.listActive() : await orchestratorService.listAll();
  return c.json(workspaces);
}

/** Returns a workspace with its current status. */
export async function getWorkspace(c: Context) {
  const workspace = await orchestratorService.getStatus(c.req.param('id')!);
  if (!workspace) return c.json({ error: 'Workspace not found' }, 404);
  return c.json(workspace);
}

/** Starts a new agent workspace for a task. */
export async function createWorkspace(c: Context) {
  const { taskId, agentRuntimeId, baseBranch, model, providerId, workflowEnabled } =
    getValidatedBody<CreateWorkspace>(c);

  // If the caller enabled workflow mode, persist it on the task first
  if (workflowEnabled) {
    const { tasksService } = await import('../services/index.js');
    await tasksService.update(taskId, { workflowEnabled: true, workflowStage: 'brainstorm' });
  }

  const workspace = await orchestratorService.startWork(taskId, agentRuntimeId, baseBranch, model, providerId);
  return c.json(workspace, 201);
}

/** Returns the git diff for a workspace. */
export async function getWorkspaceDiff(c: Context) {
  const diff = await orchestratorService.getDiff(c.req.param('id')!);
  return c.json(diff);
}

/** Re-queues the agent with current review comments as additional context. */
export async function requestWorkspaceChanges(c: Context) {
  const workspace = await orchestratorService.requestChanges(c.req.param('id')!);
  return c.json(workspace);
}

/** Merges the workspace branch and marks the task as Done. */
export async function mergeWorkspace(c: Context) {
  const workspace = await orchestratorService.mergeAndClose(c.req.param('id')!);
  return c.json(workspace);
}

/** Marks a workspace complete without merging (for non-code tasks). */
export async function completeWorkspace(c: Context) {
  const workspace = await orchestratorService.completeWithoutMerge(c.req.param('id')!);
  return c.json(workspace);
}

/** Re-runs a workspace with a (possibly different) agent runtime and model. */
export async function rerunWorkspace(c: Context) {
  const { agentRuntimeId, model } = getValidatedBody<RerunWorkspace>(c);
  const workspace = await orchestratorService.rerun(c.req.param('id')!, agentRuntimeId, model);
  return c.json(workspace, 201);
}

/** Creates a GitHub pull request for the workspace branch. */
export async function createWorkspacePullRequest(c: Context) {
  const { title, body } = getValidatedBody<CreatePullRequest>(c);
  const result = await orchestratorService.createPullRequest(c.req.param('id')!, { title, body });
  return c.json(result, 201);
}

/** Adds a diff comment to a workspace. */
export function addWorkspaceComment(c: Context) {
  const data = getValidatedBody<AddDiffComment>(c);
  const workspace = orchestratorService.addDiffComment(c.req.param('id')!, data);
  return c.json(workspace, 201);
}

/** Edits an existing diff comment in a workspace. */
export async function editWorkspaceComment(c: Context) {
  const { body } = getValidatedBody<EditDiffComment>(c);
  const workspace = orchestratorService.editDiffComment(c.req.param('id')!, c.req.param('commentId')!, body);
  return c.json(workspace);
}

/** Removes a diff comment from a workspace. */
export function removeWorkspaceComment(c: Context) {
  const workspace = orchestratorService.removeDiffComment(c.req.param('id')!, c.req.param('commentId')!);
  return c.json(workspace);
}

/** Stops the running agent process in a workspace. */
export async function stopWorkspace(c: Context) {
  const workspace = await orchestratorService.stopWork(c.req.param('id')!);
  return c.json(workspace);
}

/** Cleans up and deletes a workspace. */
export async function deleteWorkspace(c: Context) {
  await orchestratorService.cleanup(c.req.param('id')!);
  return c.body(null, 204);
}

const LOG_DIR = path.resolve(process.cwd(), 'data', 'workspace-logs');

/** Streams the live log output of a running workspace via SSE. */
export async function streamWorkspaceLogs(c: Context) {
  const workspaceId = c.req.param('id')!;
  const logFile = path.join(LOG_DIR, `${workspaceId}.log`);

  return streamSSE(c, async (stream) => {
    let offset = 0;
    let aborted = false;
    stream.onAbort(() => {
      aborted = true;
    });

    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    const sendNewBytes = async () => {
      try {
        if (!fs.existsSync(logFile)) return;
        const stat = fs.statSync(logFile);
        if (stat.size <= offset) return;
        const buf = Buffer.alloc(stat.size - offset);
        const fd = fs.openSync(logFile, 'r');
        fs.readSync(fd, buf, 0, buf.length, offset);
        fs.closeSync(fd);
        offset = stat.size;
        await stream.writeSSE({ event: 'log', data: JSON.stringify(buf.toString('utf-8')) });
      } catch (error: unknown) {
        logger.warn('workspaces.controller :: log file read failed', error);
      }
    };

    const isWorkspaceActive = async () => {
      try {
        const { workspacesRepository } = await import('../db/repositories/index.js');
        const ws = workspacesRepository.findById(workspaceId);
        return !!ws && (ws.status === 'running' || ws.status === 'pending');
      } catch (error: unknown) {
        logger.warn('workspaces.controller :: workspace status check failed', error);
        return false;
      }
    };

    // Poll loop — runs until workspace is inactive or client disconnects
    let pingCounter = 0;
    while (!aborted) {
      await sendNewBytes();

      // Check workspace status every ~1s (every 3 poll ticks of 300ms)
      pingCounter++;
      if (pingCounter % 3 === 0) {
        const active = await isWorkspaceActive();
        if (!active) {
          await sendNewBytes(); // flush any final bytes written after last poll
          await stream.writeSSE({ event: 'done', data: '' });
          break;
        }
      }

      // Keep-alive ping every ~15s (every 50 ticks)
      if (pingCounter % 50 === 0) {
        await stream.writeSSE({ event: 'ping', data: '' });
      }

      await sleep(300);
    }
  });
}
