// External
import fs from 'node:fs';
import path from 'node:path';

// Shared
import type { Workspace } from '@atlas/shared';
import { TASK_STATUS } from '@atlas/shared';

// Repositories
import { workspacesRepository } from '../../db/repositories/index.js';

// Services
import {
  activityLogService,
  agentProvidersService,
  agentsService,
  projectsService,
  tasksService,
  workflowRunnerService,
} from '../index.js';
import { PromptBuilderService } from '../prompt-builder/prompt-builder.service.js';
import { WorktreeService } from '../worktree/worktree.service.js';

// Executors
import { executorRegistry } from '../../executors/index.js';
import { type SpawnOptions, spawnAgent } from '../../executors/spawn-agent.js';

// Lib
import { activeProcesses } from './active-processes.js';
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/orchestrator/workspace-spawn.service.ts';

export class WorkspaceSpawnService {
  private worktreeService = new WorktreeService();
  private promptBuilder = new PromptBuilderService();

  /**
   * Resolves model and provider for a spawn call using the fallback chain:
   *   model:    explicit → agent.defaultModel → executor.defaultModel → undefined
   *   provider: explicit providerId → agent.providerId → none
   */
  async resolveSpawnOptions(
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

    // Validate model is compatible with this executor's presets
    if (resolvedModel && executor.modelPresets?.length) {
      const known = new Set(executor.modelPresets.map((p) => p.value));
      if (!known.has(resolvedModel)) {
        logger.warn(
          `${FILE_PATH} :: resolveSpawnOptions - model "${resolvedModel}" not in ${executor.id} presets, falling back to ${executor.defaultModel ?? 'runtime default'}`,
        );
        resolvedModel = executor.defaultModel;
      }
    }

    const spawnOpts: SpawnOptions = { model: resolvedModel };

    if (providerIdToLoad && executor.providerMapping?.length) {
      try {
        const provider = await agentProvidersService.getById(providerIdToLoad);
        spawnOpts.provider = { type: provider.type, apiKey: provider.apiKey, baseUrl: provider.baseUrl };
      } catch {
        logger.warn(
          `${FILE_PATH} :: resolveSpawnOptions - provider ${providerIdToLoad} not found, skipping credential injection`,
        );
      }
    }

    return { resolvedModel, spawnOpts };
  }

  /** Builds the prompt for a task via PromptBuilderService. */
  async buildPrompt(opts: {
    taskId: string;
    projectId: string;
    agentId?: string | null;
    hasMcpAccess?: boolean;
    workflowStage?: 'brainstorm' | 'plan' | 'execute' | null;
  }): Promise<string> {
    return this.promptBuilder.build(opts);
  }

  /**
   * Kicks off a structured brainstorm or plan stage via the AI SDK.
   * Creates the workspace and returns it immediately — the actual AI call
   * runs in the background so the HTTP response is instant.
   */
  private async runStructuredStage(
    stage: 'brainstorm' | 'plan',
    task: {
      name: string;
      description?: string | null;
      notes?: string | null;
      definitionOfDone?: string | null;
      agentId?: string | null;
      projectId?: string | null;
    },
    project: { id: string },
    taskId: string,
    agentRuntimeId: string,
    resolvedModel: string | null,
    providerId?: string,
    parentWorkspaceId?: string,
  ): Promise<Workspace | null> {
    const providerIdToLoad = providerId ?? (task.agentId ? (await agentsService.getById(task.agentId)).providerId : null);
    if (!providerIdToLoad) {
      logger.info(
        `${FILE_PATH} :: runStructuredStage - no API provider configured, falling back to CLI for ${stage}`,
      );
      activityLogService.log({
        projectId: project.id,
        taskId,
        agentId: task.agentId,
        eventType: 'agent_started',
        description: `No API provider configured — falling back to CLI for ${stage}`,
        metadata: { stage, fallback: 'cli' },
      });
      return null;
    }

    const resolvedProvider = await agentProvidersService.getById(providerIdToLoad);

    const workspace = workspacesRepository.insert({
      taskId,
      projectId: project.id,
      agentId: task.agentId ?? null,
      agentRuntime: agentRuntimeId,
      model: resolvedProvider.modelName ?? null,
      branchName: 'n/a',
      worktreePath: 'n/a',
      status: 'running',
      workflowStage: stage,
      parentWorkspaceId: parentWorkspaceId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await tasksService.update(taskId, { status: TASK_STATUS.IN_PROGRESS });

    // Fire-and-forget: run the AI call in the background so the HTTP response is instant.
    // The client polls workspace status via refetchInterval and will pick up completion/failure.
    this.executeStructuredStageInBackground(stage, task, project, taskId, workspace.id, resolvedProvider);

    return workspacesRepository.findByIdOrThrow(workspace.id);
  }

  /** Background execution of a structured stage — called fire-and-forget from runStructuredStage. */
  private executeStructuredStageInBackground(
    stage: 'brainstorm' | 'plan',
    task: {
      name: string;
      description?: string | null;
      notes?: string | null;
      definitionOfDone?: string | null;
      agentId?: string | null;
      projectId?: string | null;
    },
    project: { id: string },
    taskId: string,
    workspaceId: string,
    resolvedProvider: import('@atlas/shared').AgentProvider,
  ): void {
    const run = async () => {
      const providerModel = resolvedProvider.modelName ?? null;

      const stageResult =
        stage === 'brainstorm'
          ? await workflowRunnerService.runBrainstorm(task, project.id, resolvedProvider, providerModel)
          : await workflowRunnerService.runPlan(task, project.id, resolvedProvider, providerModel);

      const serialized = JSON.stringify({ stage, data: stageResult.output });

      workspacesRepository.update(workspaceId, {
        status: 'completed',
        output: serialized,
        inputTokens: stageResult.inputTokens ?? null,
        outputTokens: stageResult.outputTokens ?? null,
        completedAt: new Date().toISOString(),
      });

      const fullProject = await projectsService.getById(project.id);
      const gates = (fullProject.agentBehavior as { approvalGates?: { brainstorm?: boolean; plan?: boolean } } | null)?.approvalGates;
      const gateEnabled = stage === 'brainstorm' ? (gates?.brainstorm ?? true) : (gates?.plan ?? true);

      if (gateEnabled) {
        await tasksService.update(taskId, { status: TASK_STATUS.AWAITING_APPROVAL });
      } else {
        const { workflowAdvancementService } = await import('./workflow-advancement.service.js');
        await workflowAdvancementService.advanceWorkflowFromWorkspace(workspaceId);
      }

      activityLogService.log({
        projectId: project.id,
        taskId,
        workspaceId,
        agentId: task.agentId,
        eventType: 'agent_completed',
        description: `Structured ${stage} completed successfully`,
        metadata: { stage },
      });

      logger.info(`${FILE_PATH} :: executeStructuredStageInBackground - ${stage} completed for workspace ${workspaceId}`);
    };

    run().catch(async (error: unknown) => {
      workspacesRepository.update(workspaceId, {
        status: 'failed',
        output: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date().toISOString(),
      });

      await tasksService.update(taskId, {
        status: TASK_STATUS.TODO,
        workflowEnabled: false,
        workflowStage: null,
      }).catch((e) => logger.warn(`${FILE_PATH} :: executeStructuredStageInBackground - failed to reset task`, e));

      activityLogService.log({
        projectId: project.id,
        taskId,
        workspaceId,
        agentId: task.agentId,
        eventType: 'agent_failed',
        description: `Structured ${stage} failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        metadata: { stage, error: error instanceof Error ? error.message : 'unknown' },
      });

      logger.error(`${FILE_PATH} :: executeStructuredStageInBackground - ${stage} failed for workspace ${workspaceId}`, error);
    });
  }

  /** Creates a worktree, spawns the agent process, and opens a workspace. */
  async startWork(
    taskId: string,
    agentRuntimeId: string,
    baseBranch?: string,
    model?: string,
    providerId?: string,
    workflowStage?: 'brainstorm' | 'plan' | 'execute' | null,
    parentWorkspaceId?: string,
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

      const { resolvedModel, spawnOpts } = await this.resolveSpawnOptions(executor, task.agentId, model, providerId);

      // Determine the effective workflow stage for this run.
      const effectiveStage = workflowStage ?? (task.workflowEnabled ? (task.workflowStage ?? 'brainstorm') : null);
      const isStructuredStage = effectiveStage === 'brainstorm' || effectiveStage === 'plan';

      if (isStructuredStage) {
        const structuredResult = await this.runStructuredStage(
          effectiveStage as 'brainstorm' | 'plan',
          task,
          project,
          taskId,
          agentRuntimeId,
          resolvedModel ?? null,
          providerId,
          parentWorkspaceId,
        );
        if (structuredResult) return structuredResult;
        // Provider unavailable — fall through to CLI execution
      }

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

      // Copy plan artifact into the worktree so the execute agent has it
      if (effectiveStage === 'execute') {
        const srcPlan = path.join(project.localPath, 'specs', 'atlas-plan.md');
        if (fs.existsSync(srcPlan)) {
          const destDir = path.join(worktreePath, 'specs');
          fs.mkdirSync(destDir, { recursive: true });
          fs.copyFileSync(srcPlan, path.join(destDir, 'atlas-plan.md'));
          logger.info(`${FILE_PATH} :: startWork - copied atlas-plan.md into worktree`);
        }
      }

      const workspace = workspacesRepository.insert({
        taskId,
        projectId: project.id,
        agentId: task.agentId ?? null,
        agentRuntime: agentRuntimeId,
        model: resolvedModel ?? null,
        branchName,
        worktreePath,
        status: 'pending',
        workflowStage: effectiveStage ?? null,
        parentWorkspaceId: parentWorkspaceId ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const prompt = await this.promptBuilder.build({
        taskId,
        projectId: project.id,
        agentId: task.agentId,
        hasMcpAccess: executor.mcpConfigFormat !== 'none',
        workflowStage: effectiveStage,
      });

      const cwd = executor.usesProjectRoot ? project.localPath : worktreePath;
      const result = await spawnAgent(
        workspace.id,
        executor,
        cwd,
        prompt,
        {
          onCompleted: (output) => {
            activeProcesses.delete(workspace.id);
            const ws = workspacesRepository.update(workspace.id, {
              status: 'completed',
              output,
              completedAt: new Date().toISOString(),
            });

            // Workflow mode: pause for human approval between stages
            const isWorkflowStage = ws.workflowStage === 'brainstorm' || ws.workflowStage === 'plan';
            const nextStatus = isWorkflowStage ? TASK_STATUS.AWAITING_APPROVAL : TASK_STATUS.IN_REVIEW;
            tasksService.update(ws.taskId, { status: nextStatus }).catch((e) => {
              logger.warn(`${FILE_PATH} :: spawnAgent - failed to update task status after completion`, e);
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
        },
        spawnOpts,
      );

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
}

export const workspaceSpawnService = new WorkspaceSpawnService();
