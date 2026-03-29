// Shared
import type { Memory } from '@atlas/shared';

// Repositories
import { integrationsRepository } from '../../db/repositories/index.js';

// Lib
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/integrations/supermemory.service.ts';
const INTEGRATION_NAME = 'supermemory';
const DEFAULT_BASE_URL = 'https://api.supermemory.ai/v3';

interface SupermemoryConfig {
  apiKey: string;
  baseUrl: string;
}

interface SupermemorySearchResult {
  content: string;
  score?: number;
}

export class SupermemoryService {
  /** Reads the current Supermemory config from DB. Returns null if not enabled or not configured. */
  private getConfig(): SupermemoryConfig | null {
    const integration = integrationsRepository.findByName(INTEGRATION_NAME);
    if (!integration?.enabled || !integration.apiKey) return null;
    return {
      apiKey: integration.apiKey,
      baseUrl: (integration.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, ''),
    };
  }

  /** Calls the Supermemory REST API. */
  private async request(
    config: SupermemoryConfig,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const res = await fetch(`${config.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Supermemory API error ${res.status}: ${text}`);
    }
    return res.json();
  }

  /**
   * Syncs a memory to Supermemory. Fire-and-forget — call without await.
   * Uses the projectId (or "global") as a containerTag for partitioning.
   */
  async syncMemory(memory: Memory): Promise<void> {
    const config = this.getConfig();
    if (!config) return;

    const containerTag = memory.projectId ?? 'global';
    const content = [
      memory.name ? `[${memory.type ?? 'Memory'}] ${memory.name}` : `[${memory.type ?? 'Memory'}]`,
      memory.content,
    ].join('\n');

    try {
      await this.request(config, 'POST', '/memories', {
        content,
        containerTags: [containerTag],
        metadata: {
          memoryId: memory.id,
          type: memory.type,
          scope: memory.scope,
          projectId: memory.projectId,
        },
      });
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: syncMemory`, error);
    }
  }

  /**
   * Searches Supermemory for memories relevant to the query within a container.
   * Returns an array of content strings, empty if not configured or on error.
   */
  async searchRelevant(query: string, containerId: string, limit = 8): Promise<string[]> {
    const config = this.getConfig();
    if (!config) return [];

    try {
      const result = await this.request(config, 'POST', '/search/memory-entries', {
        q: query,
        containerTags: [containerId],
        limit,
      }) as { results?: SupermemorySearchResult[] };

      return (result.results ?? []).map((r) => r.content).filter(Boolean);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: searchRelevant`, error);
      return [];
    }
  }

  /**
   * Tests the Supermemory connection by performing a lightweight search.
   * Returns { ok: true } on success or { ok: false, error: string } on failure.
   */
  async testConnection(apiKey: string, baseUrl?: string | null): Promise<{ ok: boolean; error?: string }> {
    const config: SupermemoryConfig = {
      apiKey,
      baseUrl: (baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, ''),
    };
    try {
      await this.request(config, 'POST', '/search/memory-entries', {
        q: 'test',
        containerTags: ['__health_check__'],
        limit: 1,
      });
      return { ok: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { ok: false, error: message };
    }
  }
}
