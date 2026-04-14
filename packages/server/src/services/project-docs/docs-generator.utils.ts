import fs from 'node:fs';
import path from 'node:path';

import {
  MAX_SPEC_BYTES,
  MAX_TOTAL_BYTES,
  OPENAPI_SPEC_DIRS,
  OPENAPI_SPEC_NAMES,
  SKIP_DIRS,
} from './docs-generator.constants.js';

/** Recursively scans a directory for files matching the predicate. */
export function scanFiles(rootPath: string, predicate: (relativePath: string) => boolean): string[] {
  const results: string[] = [];
  const walk = (dir: string): void => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const rel = path.relative(rootPath, full);
        if (predicate(rel)) results.push(full);
      }
    }
  };
  walk(rootPath);
  return results;
}

/** Reads file contents up to the MAX_TOTAL_BYTES cap. */
export function readFileContents(files: string[]): string {
  const parts: string[] = [];
  let totalBytes = 0;

  for (const filePath of files) {
    if (totalBytes >= MAX_TOTAL_BYTES) break;
    try {
      const stat = fs.statSync(filePath);
      if (stat.size > MAX_TOTAL_BYTES - totalBytes) continue;
      const content = fs.readFileSync(filePath, 'utf-8');
      parts.push(`### File: ${path.basename(filePath)}\n\`\`\`\n${content}\n\`\`\``);
      totalBytes += stat.size;
    } catch {
      // Skip unreadable files
    }
  }

  return parts.join('\n\n');
}

/** Lists top-level directory entries (non-hidden, non-skip). */
export function listTopLevel(rootPath: string): string {
  try {
    const entries = fs.readdirSync(rootPath, { withFileTypes: true });
    return entries
      .filter((e) => !e.name.startsWith('.') && !SKIP_DIRS.has(e.name))
      .map((e) => `${e.isDirectory() ? '📁' : '📄'} ${e.name}`)
      .join('\n');
  } catch {
    return '';
  }
}

/**
 * Looks for an OpenAPI/Swagger spec file in the project root and common subdirectories.
 * Returns file contents (capped at 50 KB) if found, null otherwise.
 */
export function scanForOpenApiSpec(localPath: string): string | null {
  for (const dir of OPENAPI_SPEC_DIRS) {
    for (const name of OPENAPI_SPEC_NAMES) {
      const filePath = dir ? path.join(localPath, dir, name) : path.join(localPath, name);
      try {
        if (!fs.existsSync(filePath)) continue;
        const stat = fs.statSync(filePath);
        if (stat.size > MAX_SPEC_BYTES) continue;
        return fs.readFileSync(filePath, 'utf-8');
      } catch {
        // Skip unreadable files
      }
    }
  }
  return null;
}

/**
 * Attempts to detect a Swagger UI URL by reading package.json scripts and .env files.
 * Returns a URL string like "http://localhost:3000/api-docs" or null if no port is found.
 */
export function detectSwaggerUrl(localPath: string): string | null {
  const port = detectPort(localPath);
  if (!port) return null;

  const swaggerPath = detectSwaggerPath(localPath);
  return `http://localhost:${port}${swaggerPath}`;
}

function detectPort(localPath: string): number | null {
  try {
    const pkgPath = path.join(localPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
      const scripts = (pkg.scripts ?? {}) as Record<string, string>;
      for (const script of Object.values(scripts)) {
        const portMatch =
          /--port[= ](\d+)/.exec(script) ??
          /\bPORT=(\d+)/.exec(script) ??
          /(?<!\w)-p[= ](\d+)/.exec(script);
        if (portMatch) return parseInt(portMatch[1], 10);
      }
    }
  } catch {
    // Fall through to .env scan
  }

  const envFiles = ['.env.local', '.env', '.env.development', '.env.example'];
  for (const envFile of envFiles) {
    try {
      const envPath = path.join(localPath, envFile);
      if (!fs.existsSync(envPath)) continue;
      const content = fs.readFileSync(envPath, 'utf-8');
      const portMatch = /^(?:APP_)?PORT=(\d+)/m.exec(content);
      if (portMatch) return parseInt(portMatch[1], 10);
    } catch {
      // Skip unreadable files
    }
  }

  return null;
}

function detectSwaggerPath(localPath: string): string {
  try {
    const pkgPath = path.join(localPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
      const deps = {
        ...((pkg.dependencies ?? {}) as Record<string, string>),
        ...((pkg.devDependencies ?? {}) as Record<string, string>),
      };
      if ('@nestjs/swagger' in deps) return '/api-docs';
      if ('swagger-ui-express' in deps || 'swagger-jsdoc' in deps) return '/api-docs';
      if ('fastify-swagger' in deps || '@fastify/swagger' in deps) return '/documentation';
    }
  } catch {
    // Fall through to default
  }
  return '/api-docs';
}
