// External
import fs from 'node:fs';
import path from 'node:path';

// Shared
import type { Workspace } from '@atlas/shared';
import { TASK_STATUS } from '@atlas/shared';

// Repositories
import { workspacesRepository } from '../../../db/repositories/index.js';

// Services
import { projectDocsService, projectsService, tasksService } from '../../index.js';

// Lib
import { workspaceSpawnService } from '../spawn/workspace-spawn.service.js';
import { AppError } from '../../../lib/errors.js';
import { logger } from '../../../lib/logger.js';

const FILE_PATH = 'services/orchestrator/workflow-advancement.service.ts';

export class WorkflowAdvancementService {
  /**
   * Advances a workflow task to the next stage (brainstorm → plan → execute)
   * by spawning a new workspace with the next stage's prompt.
   */
  async advanceWorkflow(taskId: string): Promise<Workspace> {
    const FUNCTION_NAME = 'advanceWorkflow';
    try {
      const task = await tasksService.getById(taskId);

      if (task.status !== TASK_STATUS.AWAITING_APPROVAL) {
        throw new AppError('Task is not awaiting approval', { status: 400 });
      }

      const STAGE_ORDER = ['brainstorm', 'plan', 'execute'] as const;
      const currentStage = task.workflowStage as (typeof STAGE_ORDER)[number] | null;
      const currentIndex = currentStage ? STAGE_ORDER.indexOf(currentStage) : -1;
      const nextStage = STAGE_ORDER[currentIndex + 1];

      if (!nextStage) {
        throw new AppError('No next workflow stage — task is already at the final stage', { status: 400 });
      }

      // Get the most recent workspace to reuse its runtime settings
      const prevWorkspace = workspacesRepository.findByTaskId(taskId);
      if (!prevWorkspace) {
        throw new AppError('No previous workspace found for this task', { status: 404 });
      }

      // Mark the previous workspace as approved and advance the task
      workspacesRepository.update(prevWorkspace.id, { status: 'approved' });
      await tasksService.update(taskId, { workflowStage: nextStage, status: TASK_STATUS.TODO });

      // Provider is read from the task inside startWork — don't pass it here.
      return workspaceSpawnService.startWork(
        taskId,
        prevWorkspace.agentRuntime,
        undefined,
        prevWorkspace.model ?? undefined,
        nextStage,
        prevWorkspace.id,
      );
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to advance workflow', { cause: error });
    }
  }

  /** Advances a workflow from a specific workspace ID to the next stage. */
  async advanceWorkflowFromWorkspace(workspaceId: string, selectedApproach?: string): Promise<Workspace> {
    const FUNCTION_NAME = 'advanceWorkflowFromWorkspace';
    try {
      const prevWorkspace = workspacesRepository.findByIdOrThrow(workspaceId);
      const task = await tasksService.getById(prevWorkspace.taskId);

      const workspaceCompleted = prevWorkspace.status === 'completed';
      const taskReady = task.status === TASK_STATUS.AWAITING_APPROVAL || task.status === TASK_STATUS.IN_PROGRESS;
      if (!workspaceCompleted && !taskReady) {
        throw new AppError('Task is not in a state that can advance', { status: 400 });
      }

      const STAGE_ORDER = ['brainstorm', 'plan', 'execute'] as const;
      const currentStage = prevWorkspace.workflowStage as (typeof STAGE_ORDER)[number] | null;
      const currentIndex = currentStage ? STAGE_ORDER.indexOf(currentStage) : -1;
      const nextStage = STAGE_ORDER[currentIndex + 1];

      if (!nextStage) {
        throw new AppError('No next workflow stage — workspace is at the final stage', { status: 400 });
      }

      workspacesRepository.update(prevWorkspace.id, { status: 'approved' });
      await tasksService.update(prevWorkspace.taskId, { workflowStage: nextStage, status: TASK_STATUS.TODO });

      // When advancing brainstorm → plan, inject the selected approach so the plan stage uses it
      if (nextStage === 'plan' && selectedApproach) {
        const existingNotes = task.notes ?? '';
        const approachNote = `\n\n**Selected Approach:** ${selectedApproach}`;
        await tasksService.update(prevWorkspace.taskId, {
          notes: existingNotes + approachNote,
        });
      }

      if (nextStage === 'execute' && prevWorkspace.output) {
        try {
          const parsed = JSON.parse(prevWorkspace.output);
          if (parsed.stage === 'plan' && parsed.data) {
            const { formatPlanAsMarkdown } = await import('../../../lib/plan-formatter.js');
            const fullProject = await projectsService.getById(task.projectId!);
            if (fullProject.localPath) {
              const specsDir = path.join(fullProject.localPath, 'specs');
              if (!fs.existsSync(specsDir)) fs.mkdirSync(specsDir, { recursive: true });
              fs.writeFileSync(path.join(specsDir, 'atlas-plan.md'), formatPlanAsMarkdown(parsed.data), 'utf-8');
              logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - wrote specs/atlas-plan.md`);
            }

            // Save plan as a project doc (accumulates — not overwritten)
            if (task.projectId) {
              const markdown = formatPlanAsMarkdown(parsed.data);
              projectDocsService.savePlan(task.projectId, task.name, markdown);
            }
          }
        } catch (e) {
          logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to write plan artifact`, e);
        }
      }

      // Provider is read from the task inside startWork — don't pass it here.
      return workspaceSpawnService.startWork(
        prevWorkspace.taskId,
        prevWorkspace.agentRuntime,
        undefined,
        prevWorkspace.model ?? undefined,
        nextStage,
        workspaceId,
      );
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to advance workflow from workspace', { cause: error });
    }
  }

  /**
   * Rejects the workflow output from a specific workspace. Terminates the
   * workspace (status = 'stopped') and sends the task back to To Do, so the
   * state machine no longer maps this workspace to `awaitingApproval` next
   * time the user opens it.
   */
  async rejectWorkflowFromWorkspace(workspaceId: string): Promise<Workspace> {
    const FUNCTION_NAME = 'rejectWorkflowFromWorkspace';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);
      workspacesRepository.update(workspace.id, {
        status: 'stopped',
        completedAt: workspace.completedAt ?? new Date().toISOString(),
      });
      await tasksService.update(workspace.taskId, { status: TASK_STATUS.TODO });
      return workspacesRepository.findByIdOrThrow(workspace.id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to reject workflow from workspace', { cause: error });
    }
  }
}

export const workflowAdvancementService = new WorkflowAdvancementService();
