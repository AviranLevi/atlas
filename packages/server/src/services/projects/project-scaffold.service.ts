// Shared
import type { Project, ScaffoldProject } from '@atlas/shared';

// Services
import { ProjectsService } from './projects.service.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { gitInit, mkdirSafe } from '../../lib/filesystem-scanner/index.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/projects/project-scaffold.service.ts';

export class ProjectScaffoldService {
  constructor(private readonly projects = new ProjectsService()) {}

  /**
   * Creates a new folder under `parentPath`, optionally initializes it as a git repo, and
   * registers it as a project. Returns the created Project.
   *
   * Security: parent path is validated against the allowed-roots policy by `mkdirSafe`.
   */
  async scaffold(data: ScaffoldProject): Promise<Project> {
    const FUNCTION_NAME = 'scaffold';
    let createdPath: string | null = null;
    try {
      createdPath = mkdirSafe(data.parentPath, data.folderName);

      if (data.initGit) {
        gitInit(createdPath, data.initialBranch);
      }

      const project = await this.projects.create({
        name: data.projectName,
        localPath: createdPath,
        defaultBranch: data.initGit ? data.initialBranch : null,
        color: data.color ?? null,
        status: 'active',
      });

      logger.info(
        `${FILE_PATH} :: ${FUNCTION_NAME} - scaffolded project ${project.id} at ${createdPath} (initGit=${data.initGit})`,
      );
      return project;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to scaffold project', { cause: error });
    }
  }
}
