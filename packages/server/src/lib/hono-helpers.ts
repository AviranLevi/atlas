// External
import type { Context } from 'hono';

/**
 * Extracts the validated JSON body from a Hono context.
 * Used in controllers where zValidator middleware has already validated the input.
 */
export function getValidatedBody<T>(c: Context): T {
  // biome-ignore lint/suspicious/noExplicitAny: zValidator augments the request object at runtime
  return (c.req as any).valid('json') as T;
}

/**
 * Extracts the validated query from a Hono context.
 * Used in controllers where zValidator middleware has already validated the input.
 */
export function getValidatedQuery<T>(c: Context): T {
  // biome-ignore lint/suspicious/noExplicitAny: zValidator augments the request object at runtime
  return (c.req as any).valid('query') as T;
}
