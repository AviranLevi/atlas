/**
 * JSON fixtures for workspace.output content consumed by
 * `tryParseWorkflowOutput`. These are deliberately hand-written (not
 * generated from the Zod schema) so that a breaking change to either the
 * schema or the parser produces a loud diff here — if this file keeps
 * compiling while the parser changed behaviour, the tests have drifted.
 */

export const VALID_BRAINSTORM = JSON.stringify({
  stage: 'brainstorm',
  data: {
    overview: 'overview',
    ideas: [{ title: 'a', description: 'd', tradeoffs: [], recommended: true }],
    recommendation: 'r',
  },
});

export const VALID_PLAN = JSON.stringify({
  stage: 'plan',
  data: {
    summary: 's',
    estimatedComplexity: 'low',
    steps: [{ order: 1, title: 't', file: null, description: 'd', risk: 'low' }],
    commitSteps: [],
    concerns: [],
  },
});

/** Unparseable JSON — triggers the parser's JSON.parse catch. */
export const MALFORMED_JSON = '{ not json';

/** Parseable JSON whose shape fails the discriminated-union schema check. */
export const WRONG_SHAPE_JSON = JSON.stringify({ stage: 'nope', data: {} });

/** Returns the matching valid fixture for a given structured stage. */
export function validFor(stage: 'brainstorm' | 'plan'): string {
  return stage === 'brainstorm' ? VALID_BRAINSTORM : VALID_PLAN;
}
