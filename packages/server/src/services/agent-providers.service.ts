import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';
import { agentProvidersRepository } from '../db/repositories/index.js';
import type { AgentProvider, CreateAgentProvider, UpdateAgentProvider } from '@my-agents/shared';

const FILE_PATH = 'services/agent-providers.service.ts';

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

  async testConnection(id: string): Promise<{ ok: boolean; error?: string }> {
    const FUNCTION_NAME = 'testConnection';
    try {
      const provider = this.repo.findByIdOrThrow(id);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out after 10s')), 10000)
      );

      const test = async (): Promise<void> => {
        switch (provider.type) {
          case 'anthropic': {
            const { default: Anthropic } = await import('@anthropic-ai/sdk');
            const client = new Anthropic({ apiKey: provider.apiKey ?? '' });
            await client.messages.create({
              model: provider.modelName,
              max_tokens: 1,
              messages: [{ role: 'user', content: 'ping' }],
            });
            break;
          }
          case 'openai':
          case 'openai-compatible': {
            const { default: OpenAI } = await import('openai');
            const client = new OpenAI({
              apiKey: provider.apiKey ?? 'none',
              baseURL: provider.baseUrl ?? undefined,
            });
            await client.chat.completions.create({
              model: provider.modelName,
              max_tokens: 1,
              messages: [{ role: 'user', content: 'ping' }],
            });
            break;
          }
          case 'ollama': {
            const baseUrl = provider.baseUrl ?? 'http://localhost:11434';
            const resp = await fetch(`${baseUrl}/api/version`);
            if (!resp.ok) throw new Error(`Ollama returned ${resp.status}`);
            break;
          }
          default:
            throw new Error(`Unknown provider type: ${provider.type}`);
        }
      };

      await Promise.race([test(), timeout]);
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
