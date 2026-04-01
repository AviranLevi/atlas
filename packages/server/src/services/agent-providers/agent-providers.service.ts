// Shared
import type { AgentProvider, CreateAgentProvider, ProviderModel, UpdateAgentProvider } from '@atlas/shared';

// Repositories
import { agentProvidersRepository } from '../../db/repositories/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';
import { LIST_MODEL_FNS, TEST_FNS } from '../../lib/providers/index.js';
import { withTimeout } from '../../lib/utils/index.js';

const FILE_PATH = 'services/agent-providers/agent-providers.service.ts';

export class AgentProvidersService {
  constructor(private readonly repo = agentProvidersRepository) {}

  async list(): Promise<AgentProvider[]> {
    const FUNCTION_NAME = 'list';
    try {
      return this.repo.findAll();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list agent providers', { cause: error });
    }
  }

  async getById(id: string): Promise<AgentProvider> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get agent provider', { cause: error });
    }
  }

  async create(data: CreateAgentProvider): Promise<AgentProvider> {
    const FUNCTION_NAME = 'create';
    try {
      return this.repo.insert(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create agent provider', { cause: error });
    }
  }

  async update(id: string, data: UpdateAgentProvider): Promise<AgentProvider> {
    const FUNCTION_NAME = 'update';
    try {
      return this.repo.update(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update agent provider', { cause: error });
    }
  }

  async delete(id: string): Promise<void> {
    const FUNCTION_NAME = 'delete';
    try {
      this.repo.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete agent provider', { cause: error });
    }
  }

  /** Queries the provider API for available models. Returns an empty array on failure. */
  async listModels(id: string): Promise<ProviderModel[]> {
    const FUNCTION_NAME = 'listModels';
    try {
      const provider = this.repo.findByIdOrThrow(id);
      const fn = LIST_MODEL_FNS[provider.type];
      if (!fn) return [];
      const models = await withTimeout(fn(provider), 15_000, 'Model listing');
      return models.sort((a, b) => a.label.localeCompare(b.label));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      return [];
    }
  }

  /** Tests connectivity to an agent provider. */
  async testConnection(id: string): Promise<{ ok: boolean; error?: string }> {
    const FUNCTION_NAME = 'testConnection';
    try {
      const provider = this.repo.findByIdOrThrow(id);
      const fn = TEST_FNS[provider.type];
      if (!fn) throw new Error(`Unknown provider type: ${provider.type}`);
      await withTimeout(fn(provider), 10_000, 'Connection test');
      return { ok: true };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
