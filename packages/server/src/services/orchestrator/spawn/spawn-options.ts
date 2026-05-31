// Services
import { agentProvidersService, agentsService } from '../../index.js';
import { PromptBuilderService } from '../../prompt-builder/prompt-builder.service.js';

// Executors
import type { executorRegistry } from '../../../executors/index.js';
import type { SpawnOptions } from '../../../executors/spawn-agent.js';

// Lib
import { logger } from '../../../lib/logger.js';

const FILE_PATH = 'services/orchestrator/spawn-options.ts';
const promptBuilder = new PromptBuilderService();

/**
 * Resolves model and provider for a spawn call using the fallback chain:
 *   model:    explicit → agent.defaultModel → executor.defaultModel → undefined
 *   provider: explicit providerId → agent.providerId → none
 */
export async function resolveSpawnOptions(
  executor: ReturnType<typeof executorRegistry.getById> & {},
  agentId: string | null | undefined,
  explicitModel?: string,
  explicitProviderId?: string,
): Promise<{ resolvedModel: string | undefined; spawnOpts: SpawnOptions }> {
  let resolvedModel = explicitModel;
  let providerIdToLoad = explicitProviderId;

  if (agentId) {
    try {
      const agent = await agentsService.getById(agentId);
      if (!resolvedModel && agent.defaultModel) resolvedModel = agent.defaultModel;
      if (!providerIdToLoad && agent.providerId) providerIdToLoad = agent.providerId;
    } catch {
      // Agent might have been deleted — continue without defaults
    }
  }

  if (!resolvedModel && executor.defaultModel) resolvedModel = executor.defaultModel;

  // Log a note when the model isn't in the static presets — it may come from
  // the dynamic model cache or user custom input. Don't reject it: the CLI
  // itself will error if the model name is invalid, and blocking here would
  // prevent users from using dynamically fetched models.
  if (resolvedModel && executor.modelPresets?.length) {
    const known = new Set(executor.modelPresets.map((p) => p.value));
    if (!known.has(resolvedModel)) {
      logger.info(
        `${FILE_PATH} :: resolveSpawnOptions - model "${resolvedModel}" not in ${executor.id} static presets (may be a cached/custom model)`,
      );
    }
  }

  const spawnOpts: SpawnOptions = { model: resolvedModel };

  if (providerIdToLoad && executor.providerMapping?.length) {
    try {
      const provider = await agentProvidersService.getById(providerIdToLoad);
      spawnOpts.provider = { type: provider.type, apiKey: provider.apiKey, baseUrl: provider.baseUrl };
    } catch {
      logger.warn(
        `${FILE_PATH} :: resolveSpawnOptions - provider ${providerIdToLoad} not found, skipping credential injection`,
      );
    }
  }

  return { resolvedModel, spawnOpts };
}

/** Builds the prompt for a task via PromptBuilderService. */
export async function buildPrompt(opts: {
  taskId: string;
  projectId: string;
  agentId?: string | null;
  hasMcpAccess?: boolean;
  workflowStage?: 'brainstorm' | 'plan' | 'execute' | null;
}): Promise<string> {
  return promptBuilder.build(opts);
}
