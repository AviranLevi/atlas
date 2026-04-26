// Lib
import { AppError } from './errors.js';
import { logger } from './logger.js';

type Awaitable<T> = T | Promise<T>;

/**
 * Wraps a sync or async function so any thrown error is funneled through
 * the AppError contract used by the global Hono error handler.
 *
 * Behavior:
 *   - AppError (and subclasses like NotFoundError) re-throw unchanged so
 *     status + message survive intact.
 *   - Anything else is logged at error level under
 *     `${filePath} :: ${functionName}` and re-thrown wrapped in a fresh
 *     AppError carrying `message` and the original cause.
 *
 * Replaces the recurring repository/service pattern:
 *
 *   try { ... } catch (error) {
 *     if (error instanceof AppError) throw error;
 *     logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
 *     throw new AppError('Failed to X', { cause: error });
 *   }
 *
 * with a single line:
 *
 *   return withAppError(() => doStuff(), {
 *     filePath: FILE_PATH, functionName: 'doStuff', message: 'Failed to X',
 *   });
 */
export function withAppError<T>(
  fn: () => Awaitable<T>,
  context: { filePath: string; functionName: string; message: string },
): Promise<T> {
  return Promise.resolve()
    .then(() => fn())
    .catch((error: unknown) => {
      if (error instanceof AppError) throw error;
      logger.error(`${context.filePath} :: ${context.functionName}`, error);
      throw new AppError(context.message, { cause: error });
    });
}

/**
 * Synchronous variant of withAppError. Use for repository methods that
 * are intentionally sync (e.g. better-sqlite3 calls).
 */
export function withAppErrorSync<T>(
  fn: () => T,
  context: { filePath: string; functionName: string; message: string },
): T {
  try {
    return fn();
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    logger.error(`${context.filePath} :: ${context.functionName}`, error);
    throw new AppError(context.message, { cause: error });
  }
}
