// Shared
import type { AgentProvider, Workspace } from '@atlas/shared';
import { TASK_STATUS } from '@atlas/shared';

// Repositories
import { workspacesRepository } from '../../../db/repositories/index.js';

// Services
import {
  activityLogService,
  agentProvidersService,
  agentsService,
  projectsService,
  tasksService,
  workflowRunnerService,
} from '../../index.js';

// Lib
import { logger } from '../../../lib/logger.js';

const FILE_PATH = 'services/orchestrator/structured-stage.service.ts';

type TaskInput = {
  name: string;
  description?: string | null;
  notes?: string | null;
  definitionOfDone?: string | null;
  agentId?: string | null;
  projectId?: string | null;
};

export class StructuredStageService {
  /**
   * Kicks off a structured brainstorm or plan stage via the AI SDK.
   * Creates the workspace and returns it immediately — the actual AI call
   * runs in the background so the HTTP response is instant.
   *
   * Returns `null` when no API provider is configured (caller falls back to CLI).
   */
  async run(
    stage: 'brainstorm' | 'plan',
    task: TaskInput,
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
        `${FILE_PATH} :: run - no API provider configured, falling back to CLI for ${stage}`,
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

    this.executeInBackground(stage, task, project, taskId, workspace.id, resolvedProvider);

    return workspacesRepository.findByIdOrThrow(workspace.id);
  }

  /** Fire-and-forget background execution of a brainstorm or plan AI call. */
  private executeInBackground(
    stage: 'brainstorm' | 'plan',
    task: TaskInput,
    project: { id: string },
    taskId: string,
    workspaceId: string,
    resolvedProvider: AgentProvider,
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
        const { workflowAdvancementService } = await import('../lifecycle/workflow-advancement.service.js');
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

      logger.info(`${FILE_PATH} :: executeInBackground - ${stage} completed for workspace ${workspaceId}`);
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
      }).catch((e) => logger.warn(`${FILE_PATH} :: executeInBackground - failed to reset task`, e));

      activityLogService.log({
        projectId: project.id,
        taskId,
        workspaceId,
        agentId: task.agentId,
        eventType: 'agent_failed',
        description: `Structured ${stage} failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        metadata: { stage, error: error instanceof Error ? error.message : 'unknown' },
      });

      logger.error(`${FILE_PATH} :: executeInBackground - ${stage} failed for workspace ${workspaceId}`, error);
    });
  }
}

export const structuredStageService = new StructuredStageService();
