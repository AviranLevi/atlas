// Executors
import type { DetectionResult, ExecutorConfig, ExecutorStatus, ModelPreset } from './executor.types.js';
import { detectExecutor } from './executor-detection.js';
import { checkLatestVersion } from './version-checker.js';
import { KNOWN_EXECUTORS } from './executor-definitions.js';

// Repositories
import { modelCacheRepository } from '../db/repositories/index.js';

// Lib
import { logger } from '../lib/logger.js';

const FILE_PATH = 'executors/executor-registry.ts';
const DETECTION_CACHE_TTL = 120_000;

class ExecutorRegistry {
  private cache: Map<string, DetectionResult> | null = null;
  private cacheTime = 0;
  private refreshPromise: Promise<void> | null = null;

  private latestVersionCache: Map<string, string> = new Map();
  private latestVersionsFetched = false;

  private async refreshCache(): Promise<void> {
    const now = Date.now();
    if (this.cache && now - this.cacheTime < DETECTION_CACHE_TTL) return;

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
    const detectionPromise = Promise.all(
      KNOWN_EXECUTORS.map(async (executor) => {
        const result = await detectExecutor(executor);
        return { executor, result };
      }),
    );

    // Fetch latest versions once on first load, then only on explicit refresh()
    const versionPromise = !this.latestVersionsFetched ? this.refreshLatestVersions() : Promise.resolve();

    const [detections] = await Promise.all([detectionPromise, versionPromise]);

    const newCache = new Map<string, DetectionResult>();
    for (const { executor, result } of detections) {
      newCache.set(executor.id, result);
      if (result.installed) {
        logger.info(`${FILE_PATH} :: detected ${executor.name} v${result.version ?? '?'} at ${result.binaryPath}`);
      }
    }

    this.cache = newCache;
    this.cacheTime = now;
  }

  private async refreshLatestVersions(): Promise<void> {
    const results = await Promise.all(
      KNOWN_EXECUTORS.map(async (executor) => {
        if (!executor.registry) return { id: executor.id, version: undefined };
        const version = await checkLatestVersion(executor.registry);
        return { id: executor.id, version };
      }),
    );

    const newCache = new Map<string, string>();
    for (const { id, version } of results) {
      if (version) newCache.set(id, version);
    }

    this.latestVersionCache = newCache;
    this.latestVersionsFetched = true;
  }

  getById(id: string): ExecutorConfig | undefined {
    return KNOWN_EXECUTORS.find((e) => e.id === id);
  }

  /**
   * Builds dynamic model presets by merging the executor's hardcoded presets with
   * cached API models transformed via `toCliModel`. Hardcoded presets are listed
   * first; dynamically added models are appended without duplicates.
   */
  private buildModelPresets(executor: ExecutorConfig): ModelPreset[] | undefined {
    const staticPresets = executor.modelPresets ?? [];
    if (!executor.toCliModel || !executor.providerMapping?.length)
      return staticPresets.length ? staticPresets : undefined;

    try {
      const cachedRows = modelCacheRepository.findAll();
      if (cachedRows.length === 0) return staticPresets.length ? staticPresets : undefined;

      const merged: ModelPreset[] = [...staticPresets];
      const seen = new Set(staticPresets.map((p) => p.value));

      // Which provider types does this executor support?
      const supportedTypes = new Set(executor.providerMapping.map((pm) => pm.providerType));

      for (const row of cachedRows) {
        if (!supportedTypes.has(row.providerType)) continue;

        for (const model of row.models) {
          const cliName = executor.toCliModel(model.value, row.providerType);
          if (!cliName || seen.has(cliName)) continue;
          seen.add(cliName);
          merged.push({ value: cliName, label: model.label, provider: row.providerType });
        }
      }

      return merged.length ? merged : undefined;
    } catch (error: unknown) {
      logger.warn(`${FILE_PATH} :: buildModelPresets - failed for ${executor.id}`, error);
      return staticPresets.length ? staticPresets : undefined;
    }
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
        latestVersion: this.latestVersionCache.get(e.id),
        binaryPath: detection.binaryPath,
        authHint: !detection.authenticated ? e.authHint : undefined,
        setup: e.setup,
        modelFlag: e.modelFlag,
        defaultModel: e.defaultModel,
        modelPresets: this.buildModelPresets(e),
        providerMapping: e.providerMapping,
        supportsCustomModel: e.supportsCustomModel,
      };
    });
  }

  async listInstalled(): Promise<ExecutorStatus[]> {
    return (await this.listAll()).filter((e) => e.installed);
  }

  /** Force refresh detection and re-check latest versions from registries */
  async refresh(): Promise<void> {
    this.cache = null;
    this.latestVersionsFetched = false;
    await this.refreshCache();
  }
}

export const executorRegistry = new ExecutorRegistry();
