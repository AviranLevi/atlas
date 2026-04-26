// Lib
import { withAppError } from '../../lib/with-app-error.js';

/**
 * The minimal repository surface required by `createResourceCrud`. Skills and
 * rules repositories both satisfy this shape — keeping it structural means
 * future "resource-with-typed-tags" repos can plug in for free.
 */
export type ResourceRepo<TItem, TCreate, TUpdate> = {
  findAll(): TItem[];
  findByProjectOrGlobal(projectId: string): TItem[];
  findByIdOrThrow(id: string): TItem;
  insert(data: TCreate): TItem;
  update(id: string, data: TUpdate): TItem;
  remove(id: string): void;
};

type ResourceFilters = {
  projectId?: string;
  type?: string;
};

type ResourceCrudOptions = {
  /** Used in error messages, e.g. `Failed to list ${resourceName}s`. */
  resourceName: string;
  /** Used as the `filePath` field passed to logger via withAppError. */
  filePath: string;
};

/**
 * Builds the standard list/getById/create/update/delete surface that
 * skills, rules, and similar resource services all share. Each method
 * funnels its error through `withAppError` so AppError contracts stay
 * consistent across services.
 */
export function createResourceCrud<TItem extends { type?: string | null }, TCreate, TUpdate>(
  repo: ResourceRepo<TItem, TCreate, TUpdate>,
  { resourceName, filePath }: ResourceCrudOptions,
) {
  const list = (filters?: ResourceFilters): Promise<TItem[]> =>
    withAppError(
      () => {
        const base = filters?.projectId ? repo.findByProjectOrGlobal(filters.projectId) : repo.findAll();
        return filters?.type ? base.filter((item) => item.type === filters.type) : base;
      },
      { filePath, functionName: 'list', message: `Failed to list ${resourceName}s` },
    );

  const getById = (id: string): Promise<TItem> =>
    withAppError(() => repo.findByIdOrThrow(id), {
      filePath,
      functionName: 'getById',
      message: `Failed to get ${resourceName}`,
    });

  const create = (data: TCreate): Promise<TItem> =>
    withAppError(() => repo.insert(data), {
      filePath,
      functionName: 'create',
      message: `Failed to create ${resourceName}`,
    });

  const update = (id: string, data: TUpdate): Promise<TItem> =>
    withAppError(() => repo.update(id, data), {
      filePath,
      functionName: 'update',
      message: `Failed to update ${resourceName}`,
    });

  const remove = (id: string): Promise<void> =>
    withAppError(
      () => {
        repo.remove(id);
      },
      { filePath, functionName: 'delete', message: `Failed to delete ${resourceName}` },
    );

  return { list, getById, create, update, remove };
}
