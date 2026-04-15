import type { RegistryInfo } from './executor.types.js';
import { logger } from '../lib/logger.js';

const FILE_PATH = 'executors/version-checker.ts';
const FETCH_TIMEOUT_MS = 5_000;

async function fetchWithTimeout(url: string): Promise<Response> {
  return fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  });
}

async function fetchNpmLatest(packageName: string): Promise<string | undefined> {
  const res = await fetchWithTimeout(`https://registry.npmjs.org/${packageName}/latest`);
  if (!res.ok) return undefined;
  const data = (await res.json()) as { version?: string };
  return data.version;
}

async function fetchPypiLatest(packageName: string): Promise<string | undefined> {
  const res = await fetchWithTimeout(`https://pypi.org/pypi/${packageName}/json`);
  if (!res.ok) return undefined;
  const data = (await res.json()) as { info?: { version?: string } };
  return data.info?.version;
}

async function fetchGithubLatest(repo: string): Promise<string | undefined> {
  const res = await fetchWithTimeout(`https://api.github.com/repos/${repo}/releases/latest`);
  if (!res.ok) return undefined;
  const data = (await res.json()) as { tag_name?: string };
  return data.tag_name?.replace(/^v/, '');
}

export async function checkLatestVersion(registry: RegistryInfo): Promise<string | undefined> {
  try {
    switch (registry.type) {
      case 'npm':
        return await fetchNpmLatest(registry.package);
      case 'pypi':
        return await fetchPypiLatest(registry.package);
      case 'github':
        return await fetchGithubLatest(registry.repo);
    }
  } catch (err) {
    logger.debug(`${FILE_PATH} :: failed to check latest version for ${JSON.stringify(registry)}: ${err}`);
    return undefined;
  }
}
