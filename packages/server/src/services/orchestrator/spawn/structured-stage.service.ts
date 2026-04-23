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
  workflowProviderId?: string | null;
};

/**
 * Result of attempting to start a structured stage:
 *   - `structured`: the AI-SDK path owns the workspace (returned as `workspace`).
 *   - `fallback`: no API provider resolved; caller must fall back to CLI and
 *     persist the short `reason` onto the resulting workspace row so the UI
 *     can explain what happened.
 */
export type StructuredStageResult = { kind: 'structured'; workspace: Workspace } | { kind: 'fallback'; reason: string };

export class StructuredStageService {
  /**
   * Kicks off a structured brainstorm or plan stage via the AI SDK.
   * Creates the workspace and returns it immediately — the actual AI call
   * runs in the background so the HTTP response is instant.
   *
   * Provider resolution is driven entirely by the task record (single source
   * of truth) so every entry point — initial start, workflow advance, rerun
   * — picks up the same provider without explicit parameter threading:
   *   task.workflowProviderId → task.agentId.providerId → CLI fallback
   *
   * Returns `{ kind: 'fallback', reason }` when no API provider can be
   * resolved (caller falls back to CLI and persists `reason` on the
   * workspace row).
   */
  async run(
    stage: 'brainstorm' | 'plan',
    task: TaskInput,
    project: { id: string },
    taskId: string,
    agentRuntimeId: string,
    parentWorkspaceId?: string,
  ): Promise<StructuredStageResult> {
    const providerIdToLoad =
      task.workflowProviderId ?? (task.agentId ? (await agentsService.getById(task.agentId)).providerId : null);

    if (!providerIdToLoad) {
      const reason = task.agentId
        ? 'No API provider on the agent — used CLI for this stage'
        : 'No agent or provider assigned — used CLI for this stage';
      logger.info(`${FILE_PATH} :: run - ${reason} (stage=${stage})`);
      activityLogService.log({
        projectId: project.id,
        taskId,
        agentId: task.agentId,
        eventType: 'agent_started',
        description: `No API provider resolved — falling back to CLI for ${stage} (${reason})`,
        metadata: { stage, fallback: 'cli', reason },
      });
      return { kind: 'fallback', reason };
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

    return { kind: 'structured', workspace: workspacesRepository.findByIdOrThrow(workspace.id) };
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
      const gates = (fullProject.agentBehavior as { approvalGates?: { brainstorm?: boolean; plan?: boolean } } | null)
        ?.approvalGates;
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

      await tasksService
        .update(taskId, {
          status: TASK_STATUS.TODO,
          workflowEnabled: false,
          workflowStage: null,
        })
        .catch((e) => logger.warn(`${FILE_PATH} :: executeInBackground - failed to reset task`, e));

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
