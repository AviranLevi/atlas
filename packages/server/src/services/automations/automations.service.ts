// Shared
import type { Automation, AutomationTemplate, CreateAutomation, UpdateAutomation, Workspace } from '@atlas/shared';

// Repositories
import { automationsRepository } from '../../db/repositories/index.js';

// Services
import type { ResourceRepo } from '../shared/resource-crud.js';
import { createResourceCrud } from '../shared/resource-crud.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { withAppError } from '../../lib/with-app-error.js';

// Templates
import { AUTOMATION_TEMPLATES } from './automations.templates.js';

const FILE_PATH = 'services/automations/automations.service.ts';

type AutomationWithType = Automation & { type?: string | null };

export class AutomationsService {
  private readonly crud;

  constructor(private readonly repo = automationsRepository) {
    this.crud = createResourceCrud<AutomationWithType, CreateAutomation, UpdateAutomation>(
      this.repo as unknown as ResourceRepo<AutomationWithType, CreateAutomation, UpdateAutomation>,
      {
        resourceName: 'automation',
        filePath: FILE_PATH,
      },
    );
  }

  list(filters?: { projectId?: string }): Promise<Automation[]> {
    return this.crud.list(filters);
  }

  getById(id: string): Promise<Automation> {
    return this.crud.getById(id);
  }

  create(data: CreateAutomation): Promise<Automation> {
    return this.crud.create(data);
  }

  update(id: string, data: UpdateAutomation): Promise<Automation> {
    return this.crud.update(id, data);
  }

  delete(id: string): Promise<void> {
    return this.crud.remove(id);
  }

  listTemplates(): AutomationTemplate[] {
    return AUTOMATION_TEMPLATES;
  }

  async runAutomation(automationId: string, projectId: string): Promise<Workspace> {
    return withAppError(
      async () => {
        const automation = await this.getById(automationId);

        const { tasksService } = await import('../index.js');
        const { orchestratorService } = await import('../index.js');
        const { executorRegistry } = await import('../../executors/index.js');

        const task = await tasksService.create({
          name: automation.name,
          status: 'To Do',
          projectId,
          agentId: automation.agentId ?? undefined,
          notes: automation.promptTemplate,
        });

        const installed = await executorRegistry.listInstalled();
        if (installed.length === 0) {
          throw new AppError('No agent runtime installed. Install an agent runtime first.');
        }

        return orchestratorService.prepareAndStartWork({
          taskId: task.id,
          agentRuntimeId: installed[0].id,
          workflowEnabled: false,
        });
      },
      { filePath: FILE_PATH, functionName: 'runAutomation', message: 'Failed to run automation' },
    );
  }
}
