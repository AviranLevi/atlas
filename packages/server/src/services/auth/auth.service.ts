// External
import crypto from 'node:crypto';

// Shared
import type { ApiKey } from '@atlas/shared';

// Repositories
import { apiKeysRepository } from '../../db/repositories/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/auth/auth.service.ts';

export class AuthService {
  /** Generates a new API key. Returns the key record and the raw key (shown once). */
  async generateKey(name: string): Promise<{ apiKey: ApiKey; rawKey: string }> {
    const FUNCTION_NAME = 'generateKey';
    try {
      const token = crypto.randomBytes(32).toString('base64url');
      const rawKey = `atlas_${token}`;
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
      const keyPrefix = rawKey.slice(0, 14);
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      apiKeysRepository.insert({ id, name, keyHash, keyPrefix, createdAt });

      return {
        apiKey: { id, name, keyPrefix, createdAt, lastUsedAt: null },
        rawKey,
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to generate API key', { cause: error });
    }
  }

  /** Validates a raw API key. Returns the key record if valid, null otherwise. */
  async validateKey(raw: string): Promise<ApiKey | null> {
    const FUNCTION_NAME = 'validateKey';
    try {
      const keyHash = crypto.createHash('sha256').update(raw).digest('hex');
      const row = apiKeysRepository.findByHash(keyHash);
      if (!row) return null;
      apiKeysRepository.updateLastUsed(row.id);
      return {
        id: row.id,
        name: row.name,
        keyPrefix: row.keyPrefix,
        createdAt: row.createdAt,
        lastUsedAt: new Date().toISOString(),
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      return null;
    }
  }

  /** First-time setup: only succeeds if no keys exist. */
  async setupFirstKey(name: string): Promise<{ apiKey: ApiKey; rawKey: string }> {
    const FUNCTION_NAME = 'setupFirstKey';
    try {
      const existing = apiKeysRepository.findAll();
      if (existing.length > 0) {
        throw new AppError('Setup already complete', { status: 409 });
      }
      return this.generateKey(name);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to setup first key', { cause: error });
    }
  }

  /** True if at least one API key exists. Used to gate bootstrap. */
  async keysExist(): Promise<boolean> {
    const FUNCTION_NAME = 'keysExist';
    try {
      return apiKeysRepository.findAll().length > 0;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to check API keys', { cause: error });
    }
  }

  /**
   * Browser bootstrap path. Identical to `setupFirstKey` but with a fixed
   * default name and a structured 409 cause so the client can render a
   * targeted recovery banner instead of parsing the message string.
   */
async bootstrapKey(): Promise<{ apiKey: ApiKey; rawKey: string }> {
    const FUNCTION_NAME = 'bootstrapKey';
    try {
      if (await this.keysExist()) {
        throw new AppError('Setup already complete', {
          status: 409,
          cause: { code: 'ALREADY_INITIALIZED' },
        });
      }
      return this.generateKey('Browser default');
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to bootstrap API key', { cause: error });
    }
  }

  /** Lists all API keys (no hashes). */
  async listKeys(): Promise<ApiKey[]> {
    const FUNCTION_NAME = 'listKeys';
    try {
      return apiKeysRepository.findAll();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list API keys', { cause: error });
    }
  }

  /** Revokes an API key by ID. */
  async revokeKey(id: string): Promise<void> {
    const FUNCTION_NAME = 'revokeKey';
    try {
      apiKeysRepository.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to revoke API key', { cause: error });
    }
  }
}
