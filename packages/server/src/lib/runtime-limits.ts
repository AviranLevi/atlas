/**
 * Per-workflow-stage maximum agent runtime in milliseconds. Exceeding this
 * triggers the watchdog which terminates the agent and marks the workspace
 * as failed with a `[watchdog] timeout` marker.
 *
 * Defaults are generous on purpose — first-day kills on legitimate long-running
 * refactors are worse than paying for a few runaway-agent minutes.
 *
 * Override per-stage via env:
 *   ATLAS_MAX_RUNTIME_MS_EXECUTE
 *   ATLAS_MAX_RUNTIME_MS_BRAINSTORM
 *   ATLAS_MAX_RUNTIME_MS_PLAN
 *   ATLAS_MAX_RUNTIME_MS_REVIEW
 *
 * Values are parsed once at startup (importing this module is the
 * initialization). Non-positive / non-numeric values fall back to the default.
 */

function parseMs(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const DEFAULT_EXECUTE_MS = 60 * 60_000;
const DEFAULT_STRUCTURED_MS = 15 * 60_000;

export const MAX_RUNTIME_MS = {
  execute: parseMs(process.env.ATLAS_MAX_RUNTIME_MS_EXECUTE, DEFAULT_EXECUTE_MS),
  brainstorm: parseMs(process.env.ATLAS_MAX_RUNTIME_MS_BRAINSTORM, DEFAULT_STRUCTURED_MS),
  plan: parseMs(process.env.ATLAS_MAX_RUNTIME_MS_PLAN, DEFAULT_STRUCTURED_MS),
  review: parseMs(process.env.ATLAS_MAX_RUNTIME_MS_REVIEW, DEFAULT_STRUCTURED_MS),
  default: DEFAULT_EXECUTE_MS,
} as const;

export type RuntimeStage = 'execute' | 'brainstorm' | 'plan' | 'review';

/** Returns the configured max runtime (ms) for a workflow stage. */
export function getMaxRuntimeMs(stage: RuntimeStage | null | undefined): number {
  if (!stage) return MAX_RUNTIME_MS.default;
  return MAX_RUNTIME_MS[stage] ?? MAX_RUNTIME_MS.default;
}
