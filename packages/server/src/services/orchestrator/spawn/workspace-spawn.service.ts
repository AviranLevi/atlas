// External
import type { ChildProcess } from 'node:child_process';

// Shared
import type { Workspace } from '@atlas/shared';
import { TASK_STATUS } from '@atlas/shared';

// Repositories
import { workspacesRepository } from '../../../db/repositories/index.js';

// Services
import { activityLogService, tasksService } from '../../index.js';
import { WorktreeService } from '../../worktree/index.js';

// Orchestrator
import { resolveSpawnOptions, buildPrompt } from './spawn-options.js';
import { structuredStageService } from './structured-stage.service.js';
import { attachWatchdog } from './spawn-watchdog.js';
import { activeProcesses } from '../shared/active-processes.js';
import type { ActiveProcessEntry } from '../shared/active-processes.js';
import { getMaxRuntimeMs, type RuntimeStage } from '../../../lib/runtime-limits.js';

// Helpers
import { validateSpawnPreconditions } from './helpers/spawn-preconditions.helper.js';
import { prepareWorktree } from './helpers/spawn-worktree-prep.helper.js';
import { createTerminalCallbacks } from './helpers/spawn-terminal-callbacks.helper.js';
import { killOnShutdown } from './helpers/spawn-shutdown-guard.helper.js';
import { notifyPipelineTransition } from './helpers/spawn-pipeline-notify.helper.js';

// Executors
import { spawnAgent } from '../../../executors/spawn-agent.js';
import type { ExecutorConfig } from '../../../executors/executor.types.js';
import type { SpawnOptions } from '../../../executors/spawn-agent.js';

// Lib
import { AppError } from '../../../lib/errors.js';
import { logger } from '../../../lib/logger.js';

const FILE_PATH = 'services/orchestrator/workspace-spawn.service.ts';

export class WorkspaceSpawnService {
  private worktreeService = new WorktreeService();

  /**
   * Creates a worktree, spawns the agent process, and opens a workspace.
   *
   * Provider selection is read from the task record (`task.workflowProviderId`,
   * then `task.agentId.providerId`). Callers that want to override the provider
   * must persist it to the task first — do not re-introduce a `providerId`
   * parameter here. This keeps every entry point (initial start, workflow
   * advance, rerun, MCP) on a single resolution path.
   */
  async startWork(
    taskId: string,
    agentRuntimeId: string,
    baseBranch?: string,
    model?: string,
    workflowStage?: 'brainstorm' | 'plan' | 'execute' | null,
    parentWorkspaceId?: string,
  ): Promise<Workspace> {
    const FUNCTION_NAME = 'startWork';
    let createdWorktreePath: string | null = null;
    let projectLocalPath: string | null = null;
    try {
      const t0 = Date.now();

      const { task, project, executor } = await validateSpawnPreconditions(taskId, agentRuntimeId);
      logger.debug(`${FILE_PATH} :: ${FUNCTION_NAME} - preconditions validated [${Date.now() - t0}ms]`);

      const effectiveProviderId = task.workflowProviderId ?? undefined;
      const { resolvedModel, spawnOpts } = await resolveSpawnOptions(
        executor,
        task.agentId,
        model,
        effectiveProviderId,
      );
      logger.debug(`${FILE_PATH} :: ${FUNCTION_NAME} - spawn options resolved [${Date.now() - t0}ms]`);

      const effectiveStage = workflowStage ?? (task.workflowEnabled ? (task.workflowStage ?? 'brainstorm') : null);
      const isStructuredStage = effectiveStage === 'brainstorm' || effectiveStage === 'plan';

      let providerFallbackReason: string | null = null;

      if (isStructuredStage) {
        const structuredResult = await structuredStageService.run(
          effectiveStage as 'brainstorm' | 'plan',
          task,
          project,
          taskId,
          agentRuntimeId,
          parentWorkspaceId,
        );
        if (structuredResult.kind === 'structured') return structuredResult.workspace;
        providerFallbackReason = structuredResult.reason;
      }

      projectLocalPath = project.localPath!;
      const { worktreePath, branchName, persistedBaseBranch } = prepareWorktree({
        worktreeService: this.worktreeService,
        localPath: projectLocalPath,
        defaultBranch: project.defaultBranch,
        taskId,
        taskName: task.name,
        baseBranch,
        effectiveStage,
      });
      createdWorktreePath = worktreePath;
      logger.debug(`${FILE_PATH} :: ${FUNCTION_NAME} - worktree prepared [${Date.now() - t0}ms]`);

      const workspace = workspacesRepository.insert({
        taskId,
        projectId: project.id,
        agentId: task.agentId ?? null,
        agentRuntime: agentRuntimeId,
        model: resolvedModel ?? null,
        branchName,
        baseBranch: persistedBaseBranch,
        worktreePath,
        status: 'pending',
        workflowStage: effectiveStage ?? null,
        parentWorkspaceId: parentWorkspaceId ?? null,
        providerFallbackReason,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      logger.info(
        `${FILE_PATH} :: ${FUNCTION_NAME} - workspace ${workspace.id} created (pending) [${Date.now() - t0}ms]`,
      );

      // Return the workspace immediately — prompt building, agent spawning,
      // and activation continue in the background so the HTTP response is not
      // blocked by potentially slow operations (external API calls, process
      // spawning, MCP config generation).
      this.spawnInBackground({
        workspace,
        taskName: task.name,
        agentId: task.agentId ?? null,
        projectId: project.id,
        projectLocalPath,
        executor,
        spawnOpts,
        resolvedModel,
        effectiveStage,
        agentRuntimeId,
        parentWorkspaceId,
        worktreePath,
        branchName,
      });

      return workspacesRepository.findByIdOrThrow(workspace.id);
    } catch (error: unknown) {
      if (createdWorktreePath && projectLocalPath) {
        try {
          this.worktreeService.remove(createdWorktreePath, projectLocalPath);
          logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - cleaned up orphaned worktree after failure`);
        } catch {
          logger.warn(
            `${FILE_PATH} :: ${FUNCTION_NAME} - failed to clean up orphaned worktree at ${createdWorktreePath}`,
          );
        }
      }
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to start work', { cause: error });
    }
  }

  /**
   * Builds the prompt, spawns the agent process, and activates the workspace.
   * Runs detached from the HTTP request so the client gets an immediate response.
   * On failure, marks the workspace as failed and cleans up the worktree.
   */
  private spawnInBackground(ctx: {
    workspace: Workspace;
    taskName: string;
    agentId: string | null;
    projectId: string;
    projectLocalPath: string;
    executor: ExecutorConfig;
    spawnOpts: SpawnOptions;
    resolvedModel: string | null | undefined;
    effectiveStage: 'brainstorm' | 'plan' | 'execute' | null;
    agentRuntimeId: string;
    parentWorkspaceId?: string;
    worktreePath: string;
    branchName: string;
  }): void {
    const FUNCTION_NAME = 'spawnInBackground';
    const t0 = Date.now();

    const run = async () => {
      const prompt = await buildPrompt({
        taskId: ctx.workspace.taskId,
        projectId: ctx.projectId,
        agentId: ctx.agentId,
        hasMcpAccess: ctx.executor.mcpConfigFormat !== 'none',
        workflowStage: ctx.effectiveStage,
      });
      logger.debug(`${FILE_PATH} :: ${FUNCTION_NAME} - prompt built [${Date.now() - t0}ms]`);

      const cwd = ctx.executor.usesProjectRoot ? ctx.projectLocalPath : ctx.worktreePath;

      const { onCompleted, onFailed } = createTerminalCallbacks({
        workspace: ctx.workspace,
        worktreeService: this.worktreeService,
        taskName: ctx.taskName,
        notifyPipeline: true,
      });

      const result = await spawnAgent(
        ctx.workspace.id,
        ctx.executor,
        cwd,
        prompt,
        { onCompleted, onFailed },
        ctx.spawnOpts,
      );
      logger.debug(`${FILE_PATH} :: ${FUNCTION_NAME} - agent spawned [${Date.now() - t0}ms]`);

      if (killOnShutdown(ctx.workspace.id, result.process)) {
        throw new AppError('Server is shutting down', { status: 503 });
      }

      await this.activateWorkspace({
        workspace: ctx.workspace,
        taskId: ctx.workspace.taskId,
        taskName: ctx.taskName,
        agentId: ctx.agentId,
        projectId: ctx.projectId,
        proc: result.process,
        onFailed,
        effectiveStage: ctx.effectiveStage,
        agentRuntimeId: ctx.agentRuntimeId,
        resolvedModel: ctx.resolvedModel,
        branchName: ctx.branchName,
      });
      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - workspace ${ctx.workspace.id} activated [${Date.now() - t0}ms]`);
    };

    // Note: this catch can't reuse createTerminalCallbacks' onFailed — its
    // dedupe guard requires the workspace in activeProcesses, which only
    // happens during activateWorkspace. Pre-activation failures land here.
    run().catch((error) => {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME} - workspace ${ctx.workspace.id}`, error);

      try {
        workspacesRepository.update(ctx.workspace.id, {
          status: 'failed',
          output: error instanceof Error ? error.message : 'Failed to start agent',
          completedAt: new Date().toISOString(),
        });
      } catch (e) {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to update workspace status`, e);
      }

      // Reset the task so it can be retried (activateWorkspace may have moved
      // it to In Progress before the failure).
      tasksService.update(ctx.workspace.taskId, { status: TASK_STATUS.TODO }).catch((e: unknown) => {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to reset task status`, e);
      });

      try {
        this.worktreeService.remove(ctx.worktreePath, ctx.projectLocalPath);
      } catch {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to clean up worktree at ${ctx.worktreePath}`);
      }

      activityLogService.log({
        projectId: ctx.projectId,
        taskId: ctx.workspace.taskId,
        workspaceId: ctx.workspace.id,
        agentId: ctx.agentId,
        eventType: 'agent_failed',
        description: `Failed to start agent: ${error instanceof Error ? error.message : 'unknown error'}`,
        metadata: { error: error instanceof Error ? error.message : String(error) },
      });

      // Without this, a pipeline that recorded this workspaceId would wait
      // forever for a status transition that never arrives.
      notifyPipelineTransition(ctx.workspace.id, 'failed');
    });
  }

  /**
   * Registers the spawned process in activeProcesses, attaches the watchdog,
   * marks the workspace as running, and emits the agent_started activity log.
   * Kept as a private method (not a standalone helper) because it is not reused
   * outside this service.
   */
  private async activateWorkspace(params: {
    workspace: Workspace;
    taskId: string;
    taskName: string;
    agentId: string | null;
    projectId: string;
    proc: ChildProcess;
    onFailed: (output: string, error?: string) => void;
    effectiveStage: 'brainstorm' | 'plan' | 'execute' | null;
    agentRuntimeId: string;
    resolvedModel: string | null | undefined;
    branchName: string;
  }): Promise<void> {
    const {
      workspace,
      taskId,
      taskName,
      agentId,
      projectId,
      proc,
      onFailed,
      effectiveStage,
      agentRuntimeId,
      resolvedModel,
      branchName,
    } = params;

    const runtimeStage: RuntimeStage = (effectiveStage as RuntimeStage | undefined) ?? 'execute';
    const maxRuntimeMs = getMaxRuntimeMs(runtimeStage);

    const entry: ActiveProcessEntry = {
      process: proc,
      onFailed,
      startedAt: Date.now(),
      stage: runtimeStage,
    };

    attachWatchdog({
      entry,
      workspaceId: workspace.id,
      projectId,
      taskId,
      agentId,
      runtimeStage,
      maxRuntimeMs,
      onTimeout: onFailed,
    });

    activeProcesses.set(workspace.id, entry);

    workspacesRepository.update(workspace.id, {
      status: 'running',
      pid: proc.pid ?? null,
      startedAt: new Date().toISOString(),
    });

    await tasksService.update(taskId, { status: TASK_STATUS.IN_PROGRESS });

    activityLogService.log({
      projectId,
      taskId,
      workspaceId: workspace.id,
      agentId,
      eventType: 'agent_started',
      description: `Agent started on task: ${taskName}`,
      metadata: { agentRuntime: agentRuntimeId, branchName, model: resolvedModel },
    });
  }
}

export const workspaceSpawnService = new WorkspaceSpawnService();
