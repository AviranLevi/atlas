// External
import fs from 'node:fs';

// Repositories
import { workspacesRepository } from '../../../../db/repositories/index.js';

// Services
import { projectsService, tasksService } from '../../../index.js';

// Executors
import { executorRegistry } from '../../../../executors/index.js';

// Lib
import { AppError } from '../../../../lib/errors.js';
import { isShuttingDown } from '../../shared/active-processes.js';

/**
 * Validates all preconditions required before spawning a new workspace.
 * Throws AppError on any failure. Returns the resolved task, project, and executor.
 */
export async function validateSpawnPreconditions(taskId: string, agentRuntimeId: string) {
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

  return { task, project, executor };
}
