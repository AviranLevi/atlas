// External
import fs from 'node:fs';
import path from 'node:path';

// Shared
import type { CreateMemory, Memory, ObsidianConfig } from '@atlas/shared';

// Repositories
import { integrationsRepository, memoryRepository } from '../../db/repositories/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/integrations/obsidian.service.ts';

const AGENT_MEMORIES_FOLDER = 'agent-memories';

export type ObsidianSyncResult = {
  imported: number;
  exported: number;
  errors: string[];
};

type VaultNote = {
  name: string;
  content: string;
  type: NonNullable<CreateMemory['type']>;
};

/** Parses YAML-style frontmatter from a markdown file, returning { meta, body }. */
function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw.trim() };
  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) meta[key.trim()] = rest.join(':').trim();
  }
  return { meta, body: match[2].trim() };
}

/** Infers a memory type from frontmatter or filename heuristics. Defaults to Convention. */
function inferType(meta: Record<string, string>, name: string): NonNullable<CreateMemory['type']> {
  const raw = (meta['type'] ?? '').toLowerCase();
  if (raw === 'decision') return 'Decision';
  if (raw === 'preference') return 'Preference';
  if (raw === 'problem') return 'Problem';
  if (raw === 'convention') return 'Convention';
  // Heuristic: filenames containing "decision" or "decided" → Decision
  if (/decision|decided/i.test(name)) return 'Decision';
  return 'Convention';
}

/** Converts a memory name to a safe filename. */
function toFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '-').toLowerCase() + '.md';
}

export class ObsidianService {
  /** Returns the parsed Obsidian integration config, or null if not configured. */
  getConfig(): ObsidianConfig | null {
    const integration = integrationsRepository.findByName('obsidian');
    if (!integration?.config) return null;
    try {
      return JSON.parse(integration.config) as ObsidianConfig;
    } catch {
      return null;
    }
  }

  /** Reads vault notes from the configured sync folder, skipping the agent-memories subfolder. */
  private readNotes(vaultPath: string, syncFolder: string): VaultNote[] {
    const dir = path.join(vaultPath, syncFolder);
    if (!fs.existsSync(dir)) return [];

    const agentMemoriesDir = path.join(dir, AGENT_MEMORIES_FOLDER);
    const notes: VaultNote[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const filePath = path.join(dir, entry.name);
      if (filePath.startsWith(agentMemoriesDir)) continue;

      const raw = fs.readFileSync(filePath, 'utf-8');
      const { meta, body } = parseFrontmatter(raw);
      if (!body) continue;
      const name = meta['name'] || entry.name.replace(/\.md$/, '');
      notes.push({ name, content: body, type: inferType(meta, name) });
    }

    return notes;
  }

  /** Writes a single memory to the vault as a markdown file. */
  private writeMemoryToVault(memory: Memory, vaultPath: string, syncFolder: string): void {
    const dir = path.join(vaultPath, syncFolder, AGENT_MEMORIES_FOLDER);
    fs.mkdirSync(dir, { recursive: true });

    const filename = toFilename(memory.name ?? memory.id);
    const type = memory.type ?? 'Convention';
    const content = [
      '---',
      'atlas-memory: true',
      `type: ${type}`,
      `created: ${memory.createdAt.split('T')[0]}`,
      `updated: ${memory.updatedAt.split('T')[0]}`,
      '---',
      '',
      memory.content,
    ].join('\n');

    fs.writeFileSync(path.join(dir, filename), content, 'utf-8');
  }

  /** Syncs notes from the vault into Atlas memories, and writes Atlas memories back to the vault. */
  async sync(): Promise<ObsidianSyncResult> {
    const FUNCTION_NAME = 'sync';
    const result: ObsidianSyncResult = { imported: 0, exported: 0, errors: [] };

    try {
      const config = this.getConfig();
      if (!config) throw new AppError('Obsidian integration is not configured');

      const { vaultPath, syncFolder, projectId } = config;

      if (!fs.existsSync(vaultPath)) {
        throw new AppError(`Vault path does not exist: ${vaultPath}`);
      }

      // --- Import: vault notes → Atlas memories ---
      const notes = this.readNotes(vaultPath, syncFolder);
      const existingMemories = projectId
        ? memoryRepository.findByProject(projectId)
        : memoryRepository.findAll();
      const existingNames = new Set(existingMemories.map((m) => m.name?.toLowerCase()));

      for (const note of notes) {
        if (existingNames.has(note.name.toLowerCase())) continue;
        try {
          memoryRepository.insert({
            name: note.name,
            content: note.content,
            type: note.type,
            scope: projectId ? 'project' : 'global',
            projectId: projectId ?? undefined,
          });
          result.imported++;
        } catch (err) {
          result.errors.push(`Import failed for "${note.name}": ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      // --- Export: Atlas memories → vault ---
      const memoriesToExport = projectId
        ? memoryRepository.findByProject(projectId)
        : memoryRepository.findAll().filter((m) => m.scope === 'global');

      for (const memory of memoriesToExport) {
        try {
          this.writeMemoryToVault(memory, vaultPath, syncFolder);
          result.exported++;
        } catch (err) {
          result.errors.push(`Export failed for "${memory.name ?? memory.id}": ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      return result;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw error instanceof AppError ? error : new AppError('Obsidian sync failed', { cause: error });
    }
  }
}
