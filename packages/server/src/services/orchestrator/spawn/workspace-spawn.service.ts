// External
import fs from 'node:fs';
import path from 'node:path';

// Shared
import type { Workspace } from '@atlas/shared';
import { TASK_STATUS } from '@atlas/shared';

// Repositories
import { workspacesRepository } from '../../../db/repositories/index.js';

// Services
import { activityLogService, projectsService, tasksService } from '../../index.js';
import { WorktreeService } from '../../worktree/index.js';

// Orchestrator
import { resolveSpawnOptions, buildPrompt } from './spawn-options.js';
import { structuredStageService } from './structured-stage.service.js';
import { ensureGitignore } from './spawn-gitignore.js';
import { attachWatchdog } from './spawn-watchdog.js';
import { activeProcesses, clearEntryTimers, isShuttingDown } from '../shared/active-processes.js';
import type { ActiveProcessEntry } from '../shared/active-processes.js';
import { getMaxRuntimeMs, type RuntimeStage } from '../../../lib/runtime-limits.js';

// Executors
import { executorRegistry } from '../../../executors/index.js';
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
      if (isShuttingDown()) {
        throw new AppError('Server is shutting down', { status: 503 });
      }

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

      // Resolve provider once, from the single source of truth (the task),
      // and reuse for both structured-stage AI SDK calls and CLI credential
      // injection.
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

      // Resolve the concrete base branch now so we can persist it with the
      // workspace row. `resolvedBaseBranch` may be undefined (caller didn't
      // specify, project has no defaultBranch); in that case fall through to
      // the service's auto-detect (main/master).
      const persistedBaseBranch = resolvedBaseBranch ?? this.worktreeService.getDefaultBranch(project.localPath);

      // Ensure worktree has a .gitignore so agents don't commit generated files
      ensureGitignore(worktreePath);

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

      const cwd = executor.usesProjectRoot ? project.localPath : worktreePath;

      // Guard against double-fire: the watchdog can call onFailed directly, then
      // proc.on('close') would call it again when the kill signal takes effect.
      let terminalCallbackFired = false;

      const onFailedCallback = (output: string, error?: string) => {
        if (terminalCallbackFired) return;
        terminalCallbackFired = true;
        const entry = activeProcesses.get(workspace.id);
        if (entry) clearEntryTimers(entry);
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
      };

      const result = await spawnAgent(
        workspace.id,
        executor,
        cwd,
        prompt,
        {
          onCompleted: (output) => {
            if (terminalCallbackFired) return;
            terminalCallbackFired = true;
            const entry = activeProcesses.get(workspace.id);
            if (entry) clearEntryTimers(entry);
            activeProcesses.delete(workspace.id);

            // Safety net: commit any changes the agent left uncommitted.
            // For execute-stage runs, this produces a loud
            // `execute: <task> (steps not tracked)` marker so prompt-
            // compliance regressions surface in the Commits panel rather
            // than hiding behind a generic chore commit.
            this.worktreeService.ensureChangesCommitted(worktreePath, {
              taskName: task.name,
              stage: effectiveStage ?? null,
            });

            const ws = workspacesRepository.update(workspace.id, {
              status: 'completed',
              output,
              completedAt: new Date().toISOString(),
            });

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
          onFailed: onFailedCallback,
        },
        spawnOpts,
      );

      // Race mitigation: isShuttingDown() was false at the top of startWork,
      // but spawnAgent + buildPrompt + DB writes above can take non-trivial
      // time. If a SIGINT arrived during that window, the shutdown handler
      // snapshotted activeProcesses BEFORE we could insert our new child.
      // Kill it now to prevent an orphan that survives process.exit.
      if (isShuttingDown()) {
        const proc = result.process;
        if (proc.pid) {
          try {
            process.kill(-proc.pid, 'SIGKILL');
          } catch {
            try {
              proc.kill('SIGKILL');
            } catch {
              /* already dead */
            }
          }
        }
        workspacesRepository.update(workspace.id, {
          status: 'stopped',
          pid: proc.pid ?? null,
          completedAt: new Date().toISOString(),
        });
        throw new AppError('Server is shutting down', { status: 503 });
      }

      const runtimeStage: RuntimeStage = (effectiveStage as RuntimeStage | undefined) ?? 'execute';
      const maxRuntimeMs = getMaxRuntimeMs(runtimeStage);

      const entry: ActiveProcessEntry = {
        process: result.process,
        onFailed: onFailedCallback,
        startedAt: Date.now(),
        stage: runtimeStage,
      };

      attachWatchdog({
        entry,
        workspaceId: workspace.id,
        projectId: project.id,
        taskId,
        agentId: task.agentId,
        runtimeStage,
        maxRuntimeMs,
        onTimeout: onFailedCallback,
      });

      activeProcesses.set(workspace.id, entry);
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
