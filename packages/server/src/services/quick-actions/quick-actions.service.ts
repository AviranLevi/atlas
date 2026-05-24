// Shared
import type { QuickAction, QuickActionTemplate, CreateQuickAction, UpdateQuickAction, Workspace } from '@atlas/shared';

// Repositories
import { quickActionsRepository } from '../../db/repositories/index.js';

// Services
import type { ResourceRepo } from '../shared/resource-crud.js';
import { createResourceCrud } from '../shared/resource-crud.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { withAppError } from '../../lib/with-app-error.js';

// Templates
import { QUICK_ACTION_TEMPLATES } from './quick-actions.templates.js';

const FILE_PATH = 'services/quick-actions/quick-actions.service.ts';

type QuickActionWithType = QuickAction & { type?: string | null };

export class QuickActionsService {
  private readonly crud;

  constructor(private readonly repo = quickActionsRepository) {
    this.crud = createResourceCrud<QuickActionWithType, CreateQuickAction, UpdateQuickAction>(
      this.repo as unknown as ResourceRepo<QuickActionWithType, CreateQuickAction, UpdateQuickAction>,
      {
        resourceName: 'quick-action',
        filePath: FILE_PATH,
      },
    );
  }

  list(filters?: { projectId?: string }): Promise<QuickAction[]> {
    return this.crud.list(filters);
  }

  getById(id: string): Promise<QuickAction> {
    return this.crud.getById(id);
  }

  create(data: CreateQuickAction): Promise<QuickAction> {
    return this.crud.create(data);
  }

  update(id: string, data: UpdateQuickAction): Promise<QuickAction> {
    return this.crud.update(id, data);
  }

  delete(id: string): Promise<void> {
    return this.crud.remove(id);
  }

  listTemplates(): QuickActionTemplate[] {
    return QUICK_ACTION_TEMPLATES;
  }

  async runQuickAction(quickActionId: string, projectId: string): Promise<Workspace> {
    return withAppError(
      async () => {
        const quickAction = await this.getById(quickActionId);

        const { tasksService } = await import('../index.js');
        const { orchestratorService } = await import('../index.js');
        const { executorRegistry } = await import('../../executors/index.js');

        const task = await tasksService.create({
          name: quickAction.name,
          status: 'To Do',
          projectId,
          agentId: quickAction.agentId ?? undefined,
          notes: quickAction.promptTemplate,
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
      { filePath: FILE_PATH, functionName: 'runQuickAction', message: 'Failed to run quick action' },
    );
  }
}
