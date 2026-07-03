// Pure ordering helpers for the space task board. Kept free of IO so the
// reorder math is easy to reason about (and to test) apart from Supabase.
import type { TaskStatus } from '@/types/collaborate';

export const TASK_STATUSES: TaskStatus[] = ['open', 'in_progress', 'done'];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  done: 'Done',
};

interface Orderable {
  id: string;
  status: TaskStatus;
  sort_order: number;
}

export interface TaskPatch {
  id: string;
  patch: {
    status?: TaskStatus;
    sort_order?: number;
  };
}

/**
 * Group tasks into board columns, each sorted by sort_order ASC. Sort is
 * stable, so rows sharing a sort_order (e.g. the default 0) keep the query's
 * created_at ordering.
 */
export function groupByStatus<T extends Orderable>(tasks: T[]): Record<TaskStatus, T[]> {
  const groups = { open: [], in_progress: [], done: [] } as Record<TaskStatus, T[]>;
  for (const task of tasks) {
    (groups[task.status] ?? groups.open).push(task);
  }
  for (const status of TASK_STATUSES) {
    groups[status] = [...groups[status]].sort((a, b) => a.sort_order - b.sort_order);
  }
  return groups;
}

/** Append position for a new/moved task: max(sort_order in column) + 1. */
export function nextSortOrder(tasks: Orderable[], status: TaskStatus): number {
  let max = -1;
  for (const task of tasks) {
    if (task.status === status && task.sort_order > max) max = task.sort_order;
  }
  return max + 1;
}

/**
 * Compute the row patches for a drag:
 * - Cross-column: the dragged task alone moves, appended to the end of the
 *   target column.
 * - Within-column: the column is resequenced to 0..n-1 around the new
 *   position; only rows whose sort_order actually changes are patched.
 */
export function planMove(
  tasks: Orderable[],
  id: string,
  toStatus: TaskStatus,
  toIndex: number,
): TaskPatch[] {
  const dragged = tasks.find((t) => t.id === id);
  if (!dragged) return [];

  if (dragged.status !== toStatus) {
    return [{ id, patch: { status: toStatus, sort_order: nextSortOrder(tasks, toStatus) } }];
  }

  const column = groupByStatus(tasks)[toStatus];
  const fromIndex = column.findIndex((t) => t.id === id);
  const boundedIndex = Math.max(0, Math.min(toIndex, column.length - 1));
  if (fromIndex === -1 || fromIndex === boundedIndex) return [];

  const reordered = [...column];
  reordered.splice(fromIndex, 1);
  reordered.splice(boundedIndex, 0, dragged);

  const patches: TaskPatch[] = [];
  reordered.forEach((task, index) => {
    if (task.sort_order !== index) {
      patches.push({ id: task.id, patch: { sort_order: index } });
    }
  });
  return patches;
}
