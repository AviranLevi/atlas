// External
import type { ChildProcess } from 'node:child_process';

/**
 * Module-level singleton that tracks all live agent child processes.
 * Shared across all orchestrator sub-services so they all operate on the same map.
 */
export const activeProcesses = new Map<string, ChildProcess>();
