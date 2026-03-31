// External
import { type ChildProcess, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Shared
import { TASK_STATUS } from '@atlas/shared';
import type { Workspace } from '@atlas/shared';

// Services
import { tasksService, projectsService, activityLogService, agentProvidersService, agentsService } from '../index.js';
import { WorktreeService } from '../worktree/worktree.service.js';
import { PromptBuilderService } from '../prompt-builder/prompt-builder.service.js';

// Types
import type { DiffResult } from './orchestrator.types.js';

// Repositories
import { workspacesRepository } from '../../db/repositories/index.js';

// Executors
import { executorRegistry, removeMcpConfig } from '../../executors/index.js';
import { spawnAgent, type SpawnOptions } from '../../executors/spawn-agent.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

const FILE_PATH = 'services/orchestrator/orchestrator.service.ts';
const OUTPUT_DIR = path.resolve(process.cwd(), 'data', 'workspace-logs');
const ARCHIVE_DIR = path.resolve(process.cwd(), 'data', 'archived-logs');

const activeProcesses = new Map<string, ChildProcess>();

export class OrchestratorService {
  private worktreeService = new WorktreeService();
  private promptBuilder = new PromptBuilderService();

  /**
   * Resolves model and provider for a spawn call using the fallback chain:
   *   model:    explicit → agent.defaultModel → executor.defaultModel → undefined
   *   provider: explicit providerId → agent.providerId → none
   */
  private async resolveSpawnOptions(
    executor: ReturnType<typeof executorRegistry.getById> & {},
    agentId: string | null | undefined,
    explicitModel?: string,
    explicitProviderId?: string,
  ): Promise<{ resolvedModel: string | undefined; spawnOpts: SpawnOptions }> {
    let resolvedModel = explicitModel;
    let providerIdToLoad = explicitProviderId;

    if (agentId) {
      try {
        const agent = await agentsService.getById(agentId);
        if (!resolvedModel && agent.defaultModel) resolvedModel = agent.defaultModel;
        if (!providerIdToLoad && agent.providerId) providerIdToLoad = agent.providerId;
      } catch {
        // Agent might have been deleted — continue without defaults
      }
    }

    if (!resolvedModel && executor.defaultModel) resolvedModel = executor.defaultModel;

    const spawnOpts: SpawnOptions = { model: resolvedModel };

    if (providerIdToLoad && executor.providerMapping?.length) {
      try {
        const provider = await agentProvidersService.getById(providerIdToLoad);
        spawnOpts.provider = { type: provider.type, apiKey: provider.apiKey, baseUrl: provider.baseUrl };
      } catch {
        logger.warn(`${FILE_PATH} :: resolveSpawnOptions - provider ${providerIdToLoad} not found, skipping credential injection`);
      }
    }

    return { resolvedModel, spawnOpts };
  }

  /** Creates a worktree, spawns the agent process, and opens a workspace. */
  async startWork(
    taskId: string,
    agentRuntimeId: string,
    baseBranch?: string,
    model?: string,
    providerId?: string,
  ): Promise<Workspace> {
    const FUNCTION_NAME = 'startWork';
    try {
      const task = await tasksService.getById(taskId);

      if (!task.projectId) {
        throw new AppError('Task must be assigned to a project with a local path', { status: 400 });
      }

      const project = await projectsService.getById(task.projectId);

      if (!project.localPath) {
        throw new AppError(`Project "${project.name}" has no local path configured`, { status: 400 });
      }

      if (!fs.existsSync(project.localPath)) {
        throw new AppError(`Project local path does not exist: ${project.localPath}`, { status: 400 });
      }

      const executor = executorRegistry.getById(agentRuntimeId);
      if (!executor) {
        throw new AppError(`Unknown agent runtime: ${agentRuntimeId}`, { status: 400 });
      }

      const existing = workspacesRepository.findByTaskId(taskId);
      if (existing && (existing.status === 'running' || existing.status === 'pending')) {
        throw new AppError('A workspace is already active for this task', { status: 409 });
      }

      const { resolvedModel, spawnOpts } = await this.resolveSpawnOptions(
        executor,
        task.agentId,
        model,
        providerId,
      );

      // Resolve which branch to base the worktree on:
      //   1. Explicit baseBranch from the request
      //   2. Project's configured default branch
      //   3. Auto-detect (main/master) — handled inside worktreeService.create
      const resolvedBaseBranch = baseBranch || project.defaultBranch || undefined;

      const { worktreePath, branchName } = this.worktreeService.create(
        project.localPath,
        taskId,
        task.name,
        resolvedBaseBranch,
      );

      const workspace = workspacesRepository.insert({
        taskId,
        projectId: project.id,
        agentId: task.agentId ?? null,
        agentRuntime: agentRuntimeId,
        model: resolvedModel ?? null,
        branchName,
        worktreePath,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const prompt = await this.promptBuilder.build({
        taskId,
        projectId: project.id,
        agentId: task.agentId,
        hasMcpAccess: executor.mcpConfigFormat !== 'none',
      });

      const cwd = executor.usesProjectRoot ? project.localPath : worktreePath;
      const result = await spawnAgent(workspace.id, executor, cwd, prompt, {
        onCompleted: (output) => {
          activeProcesses.delete(workspace.id);
          const ws = workspacesRepository.update(workspace.id, {
            status: 'completed',
            output,
            completedAt: new Date().toISOString(),
          });
          tasksService.update(ws.taskId, { status: TASK_STATUS.IN_REVIEW }).catch((e) => {
            logger.warn(`${FILE_PATH} :: spawnAgent - failed to move task to In Review`, e);
          });
          activityLogService.log({
            projectId: ws.projectId,
            taskId: ws.taskId,
            workspaceId: workspace.id,
            agentId: ws.agentId,
            eventType: 'agent_completed',
            description: 'Agent completed successfully',
            metadata: {},
          });
          logger.info(`${FILE_PATH} :: spawnAgent - process completed for workspace ${workspace.id}`);
        },
        onFailed: (output, error) => {
          activeProcesses.delete(workspace.id);
          const ws = workspacesRepository.update(workspace.id, {
            status: 'failed',
            output,
            completedAt: new Date().toISOString(),
          });
          tasksService.update(ws.taskId, { status: TASK_STATUS.TODO }).catch((e) => {
            logger.warn(`${FILE_PATH} :: spawnAgent - failed to reset task status`, e);
          });
          activityLogService.log({
            projectId: ws.projectId,
            taskId: ws.taskId,
            workspaceId: workspace.id,
            agentId: ws.agentId,
            eventType: 'agent_failed',
            description: `Agent failed: ${error ?? 'unknown error'}`,
            metadata: { error },
          });
          logger.error(`${FILE_PATH} :: spawnAgent - process failed for workspace ${workspace.id}: ${error}`);
        },
      }, spawnOpts);

      // Store process reference and mark as running — done after spawnAgent
      // returns so result.process is available.
      activeProcesses.set(workspace.id, result.process);
      workspacesRepository.update(workspace.id, {
        status: 'running',
        pid: result.process.pid ?? null,
        startedAt: new Date().toISOString(),
      });

      await tasksService.update(taskId, { status: TASK_STATUS.IN_PROGRESS });

      activityLogService.log({
        projectId: project.id,
        taskId,
        workspaceId: workspace.id,
        agentId: task.agentId,
        eventType: 'agent_started',
        description: `Agent started on task: ${task.name}`,
        metadata: { agentRuntime: agentRuntimeId, branchName, model: resolvedModel },
      });

      return workspacesRepository.findByIdOrThrow(workspace.id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to start work', { cause: error });
    }
  }

  /** Kills the agent process and optionally resets the task status. */
  async stopWork(workspaceId: string, resetTaskStatus = true): Promise<Workspace> {
    const FUNCTION_NAME = 'stopWork';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'running' && workspace.status !== 'pending') {
        throw new AppError('Workspace is not active', { status: 400 });
      }

      const proc = activeProcesses.get(workspaceId);
      if (proc && !proc.killed) {
        proc.kill('SIGTERM');
        setTimeout(() => {
          if (!proc.killed) proc.kill('SIGKILL');
        }, 5000);
      }

      activeProcesses.delete(workspaceId);

      const updated = workspacesRepository.update(workspaceId, {
        status: 'stopped',
        completedAt: new Date().toISOString(),
      });

      // Keep the task status in sync: reset to "To Do" so the user
      // doesn't see "In Progress" for a task whose agent was stopped.
      if (resetTaskStatus) {
        await tasksService.update(workspace.taskId, { status: TASK_STATUS.TODO });
      }

      activityLogService.log({
        projectId: workspace.projectId,
        taskId: workspace.taskId,
        workspaceId,
        agentId: workspace.agentId,
        eventType: 'agent_stopped',
        description: 'Agent stopped manually',
        metadata: {},
      });

      return updated;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to stop work', { cause: error });
    }
  }

  /** Returns workspace status with optional full log output. */
  async getStatus(workspaceId: string): Promise<(Workspace & { fullOutput?: string }) | null> {
    const workspace = workspacesRepository.findById(workspaceId);

    // Return null for deleted workspaces
    // instead of throwing — avoids noisy 404 logs from polling clients.
    if (!workspace) return null;

    const logFile = path.join(OUTPUT_DIR, `${workspaceId}.log`);
    let fullOutput: string | undefined;
    if (fs.existsSync(logFile)) {
      fullOutput = fs.readFileSync(logFile, 'utf-8');
    }

    return { ...workspace, fullOutput };
  }

  /**
   * Archive a workspace log to the archived-logs directory.
   * Returns the archived file path, or undefined if no log exists.
   */
  private archiveLog(workspaceId: string, workspace: Workspace): string | undefined {
    const logFile = path.join(OUTPUT_DIR, `${workspaceId}.log`);
    if (!fs.existsSync(logFile)) return undefined;

    if (!fs.existsSync(ARCHIVE_DIR)) {
      fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    }

    // Name: taskName_branchName_timestamp.log (sanitized)
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
    const taskName = sanitize(workspace.taskName ?? 'unknown');
    const branch = sanitize(workspace.branchName ?? workspaceId);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveName = `${taskName}_${branch}_${timestamp}.log`;
    const archivePath = path.join(ARCHIVE_DIR, archiveName);

    fs.copyFileSync(logFile, archivePath);
    logger.info(`${FILE_PATH} :: archiveLog - Archived workspace log to ${archiveName}`);
    return archivePath;
  }

  /** Stops the process, removes the worktree, and deletes the MCP config. */
  async cleanup(workspaceId: string): Promise<void> {
    const FUNCTION_NAME = 'cleanup';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status === 'running') {
        await this.stopWork(workspaceId);
      }

      const task = await tasksService.getById(workspace.taskId);
      if (task.projectId) {
        const project = await projectsService.getById(task.projectId);
        if (project.localPath) {
          try {
            this.worktreeService.remove(workspace.worktreePath, project.localPath);
          } catch {
            logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - worktree already removed`);
          }
        }
      }

      const logFile = path.join(OUTPUT_DIR, `${workspaceId}.log`);
      if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
      }

      removeMcpConfig(workspaceId, executorRegistry.getById(workspace.agentRuntime)?.mcpConfigFormat);

      workspacesRepository.remove(workspaceId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cleanup workspace', { cause: error });
    }
  }

  /** Re-runs the agent on a completed workspace with review comments as context. */
  async requestChanges(workspaceId: string): Promise<Workspace> {
    const FUNCTION_NAME = 'requestChanges';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'completed') {
        throw new AppError('Can only request changes on completed workspaces', { status: 400 });
      }

      const comments: Array<{ filename: string; lineNumber: number; lineContent: string; body: string }> =
        Array.isArray(workspace.diffComments) ? workspace.diffComments : [];

      if (comments.length === 0) {
        throw new AppError('No review comments to send', { status: 400 });
      }

      const task = await tasksService.getById(workspace.taskId);
      const project = await projectsService.getById(workspace.projectId);

      if (!project.localPath) {
        throw new AppError('Project has no local path', { status: 400 });
      }

      const executor = executorRegistry.getById(workspace.agentRuntime);
      if (!executor) {
        throw new AppError(`Unknown agent runtime: ${workspace.agentRuntime}`, { status: 400 });
      }

      // Build a review prompt with the original context + comments
      const basePrompt = await this.promptBuilder.build({
        taskId: workspace.taskId,
        projectId: project.id,
        agentId: workspace.agentId,
        hasMcpAccess: executor.mcpConfigFormat !== 'none',
      });

      // Format review comments into a clear section
      const commentLines = comments.map((c) => {
        return `- **${c.filename}** (line ${c.lineNumber}): "${c.body}"${c.lineContent ? `\n  Code: \`${c.lineContent}\`` : ''}`;
      });

      const reviewSection = [
        '',
        '---',
        '',
        '## Review Comments — Changes Requested',
        '',
        'The reviewer has left the following comments on your code. Please address each one:',
        '',
        ...commentLines,
        '',
        'Please fix each issue above, then commit your changes to the current branch.',
      ].join('\n');

      const fullPrompt = basePrompt + reviewSection;

      // Resolve model/provider from workspace's recorded model + agent's provider
      const { spawnOpts } = await this.resolveSpawnOptions(
        executor,
        workspace.agentId,
        workspace.model ?? undefined,
      );

      // Re-spawn the agent on the SAME worktree (not a new one)
      const cwd = executor.usesProjectRoot ? project.localPath : workspace.worktreePath;
      const result = await spawnAgent(workspace.id, executor, cwd, fullPrompt, {
        onCompleted: (output) => {
          activeProcesses.delete(workspace.id);
          // Clear comments on success — the agent addressed them
          workspacesRepository.update(workspace.id, {
            status: 'completed',
            output,
            completedAt: new Date().toISOString(),
            diffComments: JSON.stringify([]),
          } as any);
          tasksService.update(workspace.taskId, { status: TASK_STATUS.IN_REVIEW }).catch((e) => {
            logger.warn(`${FILE_PATH} :: requestChanges - failed to move task to In Review`, e);
          });
          activityLogService.log({
            projectId: workspace.projectId,
            taskId: workspace.taskId,
            workspaceId,
            agentId: workspace.agentId,
            eventType: 'agent_completed',
            description: 'Agent completed review changes',
            metadata: {},
          });
        },
        onFailed: (output, error) => {
          activeProcesses.delete(workspace.id);
          // On failure, go back to completed + In Review so user can retry
          workspacesRepository.update(workspace.id, {
            status: 'completed',
            output,
            completedAt: new Date().toISOString(),
          });
          tasksService.update(workspace.taskId, { status: TASK_STATUS.IN_REVIEW }).catch((e) => {
            logger.warn(`${FILE_PATH} :: requestChanges - failed to reset task to In Review`, e);
          });
          activityLogService.log({
            projectId: workspace.projectId,
            taskId: workspace.taskId,
            workspaceId,
            agentId: workspace.agentId,
            eventType: 'agent_failed',
            description: `Agent failed during review changes: ${error ?? 'unknown error'}`,
            metadata: { error },
          });
        },
      }, spawnOpts);

      activeProcesses.set(workspace.id, result.process);

      // Mark as running (don't clear comments yet — cleared on success only)
      workspacesRepository.update(workspace.id, {
        status: 'running',
        pid: result.process.pid ?? null,
        startedAt: new Date().toISOString(),
        completedAt: null,
      } as any);

      await tasksService.update(workspace.taskId, { status: TASK_STATUS.IN_PROGRESS });

      activityLogService.log({
        projectId: project.id,
        taskId: workspace.taskId,
        workspaceId,
        agentId: workspace.agentId,
        eventType: 'agent_started',
        description: `Review changes requested with ${comments.length} comment(s)`,
        metadata: { commentCount: comments.length },
      });

      return workspacesRepository.findByIdOrThrow(workspace.id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to request changes', { cause: error });
    }
  }

  /** Returns the git diff for a workspace (empty if worktree is gone). */
  async getDiff(workspaceId: string): Promise<DiffResult> {
    const FUNCTION_NAME = 'getDiff';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      // For merged/stopped workspaces the worktree has been removed — return empty diff
      if (workspace.status === 'merged' || workspace.status === 'stopped') {
        return {
          files: [],
          summary: { additions: 0, deletions: 0, filesChanged: 0 },
        };
      }

      const project = await projectsService.getById(workspace.projectId);

      if (!project.localPath) {
        throw new AppError('Project has no local path', { status: 400 });
      }

      // Check that the worktree path still exists before calling git
      if (!fs.existsSync(workspace.worktreePath)) {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - worktree path no longer exists: ${workspace.worktreePath}`);
        return {
          files: [],
          summary: { additions: 0, deletions: 0, filesChanged: 0 },
        };
      }

      return this.worktreeService.getDiff(workspace.worktreePath, project.localPath);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get diff', { cause: error });
    }
  }

  /** Merges the worktree branch, moves task to Done, and archives logs. */
  async mergeAndClose(workspaceId: string): Promise<Workspace> {
    const FUNCTION_NAME = 'mergeAndClose';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'completed') {
        throw new AppError('Can only merge completed workspaces', { status: 400 });
      }

      const project = await projectsService.getById(workspace.projectId);

      if (!project.localPath) {
        throw new AppError('Project has no local path', { status: 400 });
      }

      // Merge the branch
      this.worktreeService.merge(workspace.worktreePath, project.localPath, workspace.branchName);

      // Move task to Done
      await tasksService.update(workspace.taskId, { status: TASK_STATUS.DONE });

      // Archive the workspace log (backup copy with descriptive name)
      const archivedLogPath = this.archiveLog(workspaceId, workspace);

      // Clean up worktree + MCP config (keep log file + DB record for history)
      try {
        this.worktreeService.remove(workspace.worktreePath, project.localPath);
      } catch {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - worktree already removed`);
      }

      removeMcpConfig(workspaceId, executorRegistry.getById(workspace.agentRuntime)?.mcpConfigFormat);

      // Mark as merged (keep the DB record for history)
      const merged = workspacesRepository.update(workspaceId, {
        status: 'merged',
        completedAt: new Date().toISOString(),
      });

      activityLogService.log({
        projectId: workspace.projectId,
        taskId: workspace.taskId,
        workspaceId,
        agentId: workspace.agentId,
        eventType: 'agent_completed',
        description: 'Changes merged and task completed',
        metadata: { branchName: workspace.branchName, archivedLogPath },
      });

      return merged;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to merge and close', { cause: error });
    }
  }

  /**
   * Complete a workspace without merging code changes.
   * Used for non-code tasks (research, review, memory creation, etc.)
   */
  async completeWithoutMerge(workspaceId: string): Promise<Workspace> {
    const FUNCTION_NAME = 'completeWithoutMerge';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'completed') {
        throw new AppError('Can only complete a finished workspace', { status: 400 });
      }

      const project = await projectsService.getById(workspace.projectId);

      // Move task to Done
      await tasksService.update(workspace.taskId, { status: TASK_STATUS.DONE });

      // Archive the workspace log
      const archivedLogPath = this.archiveLog(workspaceId, workspace);

      // Clean up worktree, branch, + MCP config (discard — no changes to keep)
      if (project.localPath) {
        try {
          this.worktreeService.remove(workspace.worktreePath, project.localPath);
        } catch {
          logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - worktree already removed`);
        }
        // Delete the orphaned branch (no code to preserve)
        try {
          const { execSync } = await import('child_process');
          execSync(`git branch -D "${workspace.branchName}"`, {
            cwd: project.localPath,
            stdio: 'pipe',
          });
        } catch {
          // Branch already gone — that's fine
        }
      }

      removeMcpConfig(workspaceId, executorRegistry.getById(workspace.agentRuntime)?.mcpConfigFormat);

      // Mark as merged (same final status for history consistency)
      const completed = workspacesRepository.update(workspaceId, {
        status: 'merged',
        completedAt: new Date().toISOString(),
      });

      activityLogService.log({
        projectId: workspace.projectId,
        taskId: workspace.taskId,
        workspaceId,
        agentId: workspace.agentId,
        eventType: 'agent_completed',
        description: 'Task completed (no code changes)',
        metadata: { branchName: workspace.branchName, archivedLogPath },
      });

      return completed;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to complete workspace', { cause: error });
    }
  }

  /**
   * Re-run a failed or completed workspace: clean up old one, start fresh.
   */
  async rerun(workspaceId: string, agentRuntimeId: string, model?: string): Promise<Workspace> {
    const FUNCTION_NAME = 'rerun';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'failed' && workspace.status !== 'completed' && workspace.status !== 'stopped') {
        throw new AppError('Can only re-run failed, stopped, or completed workspaces', { status: 400 });
      }

      const taskId = workspace.taskId;
      // Use the explicitly provided model, or fall back to the previous run's model
      const resolvedModel = model ?? workspace.model ?? undefined;

      // Clean up the old workspace
      await this.cleanup(workspaceId);

      // Reset task status so startWork can pick it up
      await tasksService.update(taskId, { status: TASK_STATUS.TODO });

      return this.startWork(taskId, agentRuntimeId, undefined, resolvedModel);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to re-run workspace', { cause: error });
    }
  }

  /**
   * Spawns a reviewer agent on an existing completed workspace.
   * Finds the most recent workspace for a task and starts an AI review on it.
   */
  async startAiReviewForTask(taskId: string, agentRuntimeId: string, autoFix = false): Promise<Workspace> {
    const workspace = workspacesRepository.findByTaskId(taskId);
    if (!workspace) {
      throw new AppError('No workspace found for this task', { status: 404 });
    }
    return this.startAiReview(workspace.id, agentRuntimeId, autoFix);
  }

  /**
   * The agent receives the diff + task context + DoD checklist and is instructed
   * to call the `submit_review` MCP tool with its decision.
   */
  async startAiReview(workspaceId: string, agentRuntimeId: string, autoFix = false): Promise<Workspace> {
    const FUNCTION_NAME = 'startAiReview';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'completed') {
        throw new AppError('AI review can only be started on completed workspaces', { status: 400 });
      }

      const executor = executorRegistry.getById(agentRuntimeId);
      if (!executor) {
        throw new AppError(`Unknown agent runtime: ${agentRuntimeId}`, { status: 400 });
      }

      const task = await tasksService.getById(workspace.taskId);

      // Lazy import to avoid circular dependency
      const { reviewsService } = await import('../index.js');
      const review = await reviewsService.getByTask(workspace.taskId);

      const diff = await this.getDiff(workspaceId);
      const diffText = diff.files.map((f) => `### ${f.filename}\n\`\`\`diff\n${f.patch ?? '(no patch)'}\n\`\`\``).join('\n\n');

      const checklist = review?.checklist ?? [];
      const checklistText = checklist.length > 0
        ? checklist.map((c) => `- [${c.checked ? 'x' : ' '}] ${c.item}`).join('\n')
        : '(no checklist items defined)';

      const reviewPrompt = [
        `# Code Review Task`,
        ``,
        `You are a code reviewer. Your job is to review the code changes below against the task requirements and definition of done.`,
        ``,
        `## Task: ${task.name}`,
        task.notes ? `\n**Notes:**\n${task.notes}` : '',
        ``,
        `## Definition of Done`,
        checklistText,
        ``,
        `## Code Changes`,
        diffText,
        ``,
        `## Instructions`,
        `Review the diff carefully. For each definition of done item, determine whether the code satisfies it.`,
        autoFix
          ? [
              `If all requirements are met, call \`submit_review\` with decision "approved".`,
              `If any requirements are NOT met, fix the issues directly in the code, commit your changes, then call \`submit_review\` with decision "approved" and notes describing what you fixed.`,
              `Only use "changes_requested" if you are unable to fix an issue yourself.`,
            ].join('\n')
          : [
              `Then call the \`submit_review\` MCP tool with:`,
              `- decision: "approved" if all requirements are met, or "changes_requested" if any are missing`,
              `- notes: a brief summary of your findings`,
              `- checklistUpdates: an array marking each item as checked/unchecked based on what the diff implements`,
            ].join('\n'),
        ``,
        `The reviewId is: "${review?.id ?? 'unknown'}"`,
      ].filter(Boolean).join('\n');

      const { resolvedModel, spawnOpts } = await this.resolveSpawnOptions(executor, task.agentId, undefined, undefined);

      const cwd = executor.usesProjectRoot
        ? (await projectsService.getById(workspace.projectId)).localPath ?? workspace.worktreePath
        : workspace.worktreePath;

      const result = await spawnAgent(workspaceId, executor, cwd, reviewPrompt, {
        onCompleted: (output) => {
          activeProcesses.delete(workspaceId);
          workspacesRepository.update(workspaceId, { status: 'completed', output, completedAt: new Date().toISOString() });
          activityLogService.log({
            projectId: workspace.projectId,
            taskId: workspace.taskId,
            workspaceId,
            eventType: 'agent_completed',
            description: 'AI reviewer completed',
            metadata: {},
          });
        },
        onFailed: (output, error) => {
          activeProcesses.delete(workspaceId);
          workspacesRepository.update(workspaceId, { status: 'failed', output, completedAt: new Date().toISOString() });
          logger.error(`${FILE_PATH} :: ${FUNCTION_NAME} - reviewer agent failed`, error);
        },
        ...spawnOpts,
      });

      activeProcesses.set(workspaceId, result.process);
      workspacesRepository.update(workspaceId, { pid: result.process.pid ?? null, status: 'running' });

      activityLogService.log({
        projectId: workspace.projectId,
        taskId: workspace.taskId,
        workspaceId,
        eventType: 'agent_started',
        description: 'AI reviewer started',
        metadata: { agentRuntime: agentRuntimeId },
      });

      return workspacesRepository.findByIdOrThrow(workspaceId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to start AI review', { cause: error });
    }
  }

  /** Adds a review comment (or reply) to a workspace diff. */
  addDiffComment(workspaceId: string, comment: { filename: string; lineNumber: number; lineContent: string; body: string; parentId?: string }): Workspace {
    const workspace = workspacesRepository.findByIdOrThrow(workspaceId);
    const existing = Array.isArray(workspace.diffComments) ? [...workspace.diffComments] : [];
    const newComment = {
      id: crypto.randomUUID(),
      ...comment,
      createdAt: new Date().toISOString(),
    };
    existing.push(newComment);
    return workspacesRepository.update(workspaceId, {
      diffComments: JSON.stringify(existing),
    } as any);
  }

  /** Edits an existing diff comment in a workspace. */
  editDiffComment(workspaceId: string, commentId: string, body: string): Workspace {
    const workspace = workspacesRepository.findByIdOrThrow(workspaceId);
    const existing = Array.isArray(workspace.diffComments) ? [...workspace.diffComments] : [];
    const idx = existing.findIndex((c: any) => c.id === commentId);
    if (idx === -1) throw new AppError('Comment not found', { status: 404 });
    existing[idx] = { ...existing[idx], body, updatedAt: new Date().toISOString() };
    return workspacesRepository.update(workspaceId, {
      diffComments: JSON.stringify(existing),
    } as any);
  }

  /** Removes a diff comment from a workspace. */
  removeDiffComment(workspaceId: string, commentId: string): Workspace {
    const workspace = workspacesRepository.findByIdOrThrow(workspaceId);
    const existing = Array.isArray(workspace.diffComments) ? [...workspace.diffComments] : [];
    const filtered = existing.filter((c: any) => c.id !== commentId);
    return workspacesRepository.update(workspaceId, {
      diffComments: JSON.stringify(filtered),
    } as any);
  }

  /** Returns all pending and running workspaces. */
  async listActive(): Promise<Workspace[]> {
    return [
      ...workspacesRepository.findByStatus('pending'),
      ...workspacesRepository.findByStatus('running'),
    ];
  }

  /** Returns all workspaces. */
  async listAll(): Promise<Workspace[]> {
    return workspacesRepository.findAll();
  }

  /**
   * Checks PIDs on startup and kills/marks orphaned workspaces as failed.
   * Handles two cases:
   *   1. Process is dead  -> just mark failed in DB (it already exited)
   *   2. Process is alive -> kill it (server restart doesn't mean the agent
   *      should keep running unattended) then mark failed
   */
  reconcileOnStartup(): void {
    const active = [
      ...workspacesRepository.findByStatus('running'),
      ...workspacesRepository.findByStatus('pending'),
    ];

    for (const ws of active) {
      if (ws.pid) {
        let alive = false;
        try {
          process.kill(ws.pid, 0); // signal 0 = probe, throws if dead
          alive = true;
        } catch {
          // process already gone
        }

        if (alive) {
          logger.warn(
            `${FILE_PATH} :: reconcileOnStartup - PID ${ws.pid} still running after restart, killing it (workspace ${ws.id})`,
          );
          try {
            process.kill(ws.pid, 'SIGTERM');
            // Give it 3 s then force-kill
            setTimeout(() => {
              try { process.kill(ws.pid!, 'SIGKILL'); } catch { /* already dead */ }
            }, 3000);
          } catch {
            // already exited between probe and kill -- that's fine
          }
        } else {
          logger.warn(
            `${FILE_PATH} :: reconcileOnStartup - PID ${ws.pid} not found (workspace ${ws.id})`,
          );
        }
      } else {
        logger.warn(
          `${FILE_PATH} :: reconcileOnStartup - workspace ${ws.id} has no PID recorded, marking failed`,
        );
      }

      workspacesRepository.update(ws.id, {
        status: 'failed',
        completedAt: new Date().toISOString(),
      });

      // Reset the associated task so it surfaces back in the kanban
      tasksService.update(ws.taskId, { status: TASK_STATUS.TODO }).catch((e) => {
        logger.warn(`${FILE_PATH} :: reconcileOnStartup - failed to reset task status for workspace ${ws.id}`, e);
      });
    }

    if (active.length > 0) {
      logger.info(
        `${FILE_PATH} :: reconcileOnStartup - reconciled ${active.length} orphaned workspace(s)`,
      );
    }
  }

  // ─── Pull Request ──────────────────────────────────────────────────

  /** Pushes the branch and creates a GitHub pull request via gh CLI. */
  async createPullRequest(
    workspaceId: string,
    opts: { title?: string; body?: string } = {},
  ): Promise<{ prUrl: string; prNumber: number }> {
    const FUNCTION_NAME = 'createPullRequest';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'completed') {
        throw new AppError('Can only create PR for completed workspaces', { status: 400 });
      }

      const project = await projectsService.getById(workspace.projectId);

      if (!project.localPath) {
        throw new AppError('Project has no local path', { status: 400 });
      }

      if (!project.repositoryUrl || !project.repositoryUrl.includes('github.com')) {
        throw new AppError('Project has no GitHub repository configured', { status: 400 });
      }

      // Push the branch to remote
      try {
        execSync(`git push -u origin "${workspace.branchName}"`, {
          cwd: workspace.worktreePath,
          stdio: 'pipe',
          encoding: 'utf-8',
        });
      } catch (pushError: unknown) {
        // Try from project root if worktree is gone
        execSync(`git push -u origin "${workspace.branchName}"`, {
          cwd: project.localPath,
          stdio: 'pipe',
          encoding: 'utf-8',
        });
      }

      const task = await tasksService.getById(workspace.taskId);
      const prTitle = opts.title || task.name;
      const prBody = opts.body || [
        '## Summary',
        '',
        task.notes || `Automated changes for: ${task.name}`,
        '',
        '---',
        `*Created via [atlas](${project.repositoryUrl}) workspace*`,
      ].join('\n');

      const baseBranch = project.defaultBranch || 'main';

      // Create PR using gh CLI
      const ghOutput = execSync(
        `gh pr create --title "${prTitle.replace(/"/g, '\\"')}" --body "${prBody.replace(/"/g, '\\"')}" --base "${baseBranch}" --head "${workspace.branchName}"`,
        {
          cwd: project.localPath,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      ).trim();

      // gh pr create returns the PR URL
      const prUrl = ghOutput;
      const prNumberMatch = prUrl.match(/\/pull\/(\d+)/);
      const prNumber = prNumberMatch ? parseInt(prNumberMatch[1], 10) : 0;

      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - Created PR #${prNumber}: ${prUrl}`);

      activityLogService.log({
        projectId: workspace.projectId,
        taskId: workspace.taskId,
        workspaceId,
        agentId: workspace.agentId,
        eventType: 'agent_completed',
        description: `Pull request created: #${prNumber}`,
        metadata: { prUrl, prNumber },
      });

      return { prUrl, prNumber };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      throw new AppError(`Failed to create pull request: ${msg}`, { cause: error });
    }
  }

  // ─── Archived logs ──────────────────────────────────────────────────

  /** Lists metadata for all archived workspace log files. */
  listArchivedLogs(): { filename: string; size: number; createdAt: string }[] {
    if (!fs.existsSync(ARCHIVE_DIR)) return [];
    return fs
      .readdirSync(ARCHIVE_DIR)
      .filter((f) => f.endsWith('.log'))
      .map((filename) => {
        const stat = fs.statSync(path.join(ARCHIVE_DIR, filename));
        return { filename, size: stat.size, createdAt: stat.birthtime.toISOString() };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Returns the content of an archived log file. Prevents path traversal. */
  getArchivedLog(filename: string): string | null {
    // Prevent path traversal
    const safeName = path.basename(filename);
    const filePath = path.join(ARCHIVE_DIR, safeName);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8');
  }
}
