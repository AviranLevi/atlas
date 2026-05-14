// Lib
import type { UICardResult } from './chat-ui.types.js';

/** Wraps HTML + optional tool data into a UICardResult marker. */
export function makeUICardResult(html: string, data?: unknown): UICardResult {
  return { __uiCard: true, html, data };
}

/** Type-guard for UICardResult — used by the service layer to detect and emit ui_resource events. */
export function isUICardResult(v: unknown): v is UICardResult {
  return typeof v === 'object' && v !== null && '__uiCard' in v && (v as UICardResult).__uiCard === true;
}
