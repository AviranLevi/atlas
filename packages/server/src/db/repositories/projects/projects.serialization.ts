// Shared
import type { Project } from '@atlas/shared';

/** Parses JSON blob fields (scanData, agentBehavior) on a raw row from the projects table. */
export function hydrateProject(row: Record<string, unknown>): Project {
  if (row.scanData && typeof row.scanData === 'string') {
    try {
      row.scanData = JSON.parse(row.scanData);
    } catch {
      row.scanData = null;
    }
  }
  if (row.agentBehavior && typeof row.agentBehavior === 'string') {
    try {
      row.agentBehavior = JSON.parse(row.agentBehavior);
    } catch {
      row.agentBehavior = null;
    }
  }
  return row as Project;
}

/** Serializes JSON blob fields to strings before insert/update. */
export function serializeScanData(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  if (result.scanData && typeof result.scanData === 'object') {
    result.scanData = JSON.stringify(result.scanData);
  }
  if (result.agentBehavior && typeof result.agentBehavior === 'object') {
    result.agentBehavior = JSON.stringify(result.agentBehavior);
  }
  return result;
}
