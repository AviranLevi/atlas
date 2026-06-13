export {
  activeProcesses,
  awaitPendingSpawns,
  clearEntryTimers,
  isShuttingDown,
  markShuttingDown,
  pendingSpawnCount,
  trackPendingSpawn,
} from './active-processes.js';
export type { ActiveProcessEntry } from './active-processes.js';
export type { DiffResult } from './orchestrator.types.js';
