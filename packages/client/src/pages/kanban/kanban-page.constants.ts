import { TASK_STATUS } from '@atlas/shared';
import type { TaskStatus } from '@atlas/shared';

export const COLUMNS: TaskStatus[] = [
  TASK_STATUS.TODO,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.IN_REVIEW,
  TASK_STATUS.DONE,
  TASK_STATUS.BLOCKED,
];

export const ALL_STATUSES: TaskStatus[] = [
  TASK_STATUS.BACKLOG,
  ...COLUMNS,
];
