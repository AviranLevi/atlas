import type { ExecutorConfig, ExecutorStatus, DetectionResult } from './executor.types.js';
import { KNOWN_EXECUTORS } from './executor-definitions.js';
import { detectExecutor } from './executor-detection.js';
import { logger } from '../lib/logger.js';

const FILE_PATH = 'executors/executor-registry.ts';

class ExecutorRegistry {
  private cache: Map<string, DetectionResult> | null = null;
  private cacheTime = 0;
  private refreshPromise: Promise<void> | null = null;
  private readonly CACHE_TTL = 120_000;

  private async refreshCache(): Promise<void> {
    const now = Date.now();
    if (this.cache && now - this.cacheTime < this.CACHE_TTL) return;

    // Deduplicate concurrent refresh calls
    if (this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    this.refreshPromise = this.doRefresh(now);
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefresh(now: number): Promise<void> {
    const newCache = new Map<string, DetectionResult>();

    const results = await Promise.all(
      KNOWN_EXECUTORS.map(async (executor) => {
        const result = await detectExecutor(executor);
        return { executor, result };
      }),
    );

    for (const { executor, result } of results) {
      newCache.set(executor.id, result);
      if (result.installed) {
        logger.info(
          `${FILE_PATH} :: detected ${executor.name} v${result.version ?? '?'} at ${result.binaryPath}`,
        );
      }
    }

    this.cache = newCache;
    this.cacheTime = now;
  }

  getById(id: string): ExecutorConfig | undefined {
    return KNOWN_EXECUTORS.find((e) => e.id === id);
  }

  async listAll(): Promise<ExecutorStatus[]> {
    await this.refreshCache();
    return KNOWN_EXECUTORS.map((e) => {
      const detection: DetectionResult = this.cache?.get(e.id) ?? { installed: false, authenticated: false };
      return {
        id: e.id,
        name: e.name,
        description: e.description,
        docsUrl: e.docsUrl,
        installed: detection.installed,
        authenticated: detection.authenticated,
        mcpConfigFormat: e.mcpConfigFormat,
        version: detection.version,
        binaryPath: detection.binaryPath,
        authHint: !detection.authenticated ? e.authHint : undefined,
        setup: e.setup,
        modelFlag: e.modelFlag,
        defaultModel: e.defaultModel,
        modelPresets: e.modelPresets,
        providerMapping: e.providerMapping,
        supportsCustomModel: e.supportsCustomModel,
      };
    });
  }

  async listInstalled(): Promise<ExecutorStatus[]> {
    return (await this.listAll()).filter((e) => e.installed);
  }

  /** Force refresh the detection cache */
  async refresh(): Promise<void> {
    this.cache = null;
    await this.refreshCache();
  }
}

export const executorRegistry = new ExecutorRegistry();
