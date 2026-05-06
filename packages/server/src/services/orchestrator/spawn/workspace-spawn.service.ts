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

// Executors
import { spawnAgent } from '../../../executors/spawn-agent.js';

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
    try {
      const { task, project, executor } = await validateSpawnPreconditions(taskId, agentRuntimeId);

      // Provider is sourced from the task so all entry-points share the same
      // resolution path. Callers that want a different provider persist it to
      // the task before calling startWork.
      const effectiveProviderId = task.workflowProviderId ?? undefined;
      const { resolvedModel, spawnOpts } = await resolveSpawnOptions(
        executor,
        task.agentId,
        model,
        effectiveProviderId,
      );

      // Determine the effective workflow stage for this run.
      const effectiveStage = workflowStage ?? (task.workflowEnabled ? (task.workflowStage ?? 'brainstorm') : null);
      const isStructuredStage = effectiveStage === 'brainstorm' || effectiveStage === 'plan';

      // Tracks why the structured path bailed, if it did. Persisted on the
      // CLI-fallback workspace row so the UI can explain "we wanted structured
      // output but no API provider was available".
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
        // Provider unavailable — fall through to CLI execution
      }

      const { worktreePath, branchName, persistedBaseBranch } = prepareWorktree({
        worktreeService: this.worktreeService,
        // validateSpawnPreconditions already threw if localPath is null/missing
        localPath: project.localPath!,
        defaultBranch: project.defaultBranch,
        taskId,
        taskName: task.name,
        baseBranch,
        effectiveStage,
      });

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

      const prompt = await buildPrompt({
        taskId,
        projectId: project.id,
        agentId: task.agentId,
        hasMcpAccess: executor.mcpConfigFormat !== 'none',
        workflowStage: effectiveStage,
      });

      const cwd = executor.usesProjectRoot ? project.localPath! : worktreePath;

      const { onCompleted, onFailed } = createTerminalCallbacks({
        workspace,
        worktreeService: this.worktreeService,
        taskName: task.name,
        notifyPipeline: true,
      });

      const result = await spawnAgent(workspace.id, executor, cwd, prompt, { onCompleted, onFailed }, spawnOpts);

      if (killOnShutdown(workspace.id, result.process)) {
        throw new AppError('Server is shutting down', { status: 503 });
      }

      await this.activateWorkspace({
        workspace,
        taskId,
        taskName: task.name,
        agentId: task.agentId ?? null,
        projectId: project.id,
        proc: result.process,
        onFailed,
        effectiveStage,
        agentRuntimeId,
        resolvedModel,
        branchName,
      });

      return workspacesRepository.findByIdOrThrow(workspace.id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to start work', { cause: error });
    }
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
