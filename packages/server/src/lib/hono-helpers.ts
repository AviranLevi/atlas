// External
import type { Context } from 'hono';

/**
 * Hono request shape after `zValidator` middleware runs. Augments the
 * request with a typed `valid('json' | 'query')` accessor. The middleware
 * adds this at runtime; we declare the shape here so callers can avoid
 * `as any` and still get a typed return.
 */
type ValidatedRequest = {
  valid: (target: 'json' | 'query' | 'param' | 'header' | 'form' | 'cookie') => unknown;
};

function validReq(c: Context): ValidatedRequest {
  return c.req as unknown as ValidatedRequest;
}

/**
 * Extracts the validated JSON body from a Hono context.
 * Used in controllers where zValidator middleware has already validated the input.
 */
export function getValidatedBody<T>(c: Context): T {
  return validReq(c).valid('json') as T;
}

/**
 * Extracts the validated query from a Hono context.
 * Used in controllers where zValidator middleware has already validated the input.
 */
export function getValidatedQuery<T>(c: Context): T {
  return validReq(c).valid('query') as T;
}
