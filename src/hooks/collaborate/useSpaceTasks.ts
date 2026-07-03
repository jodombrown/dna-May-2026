import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { TaskPriority, TaskStatus } from '@/types/collaborate';
import { nextSortOrder, planMove } from './boardOrdering';

export interface BoardTask {
  id: string;
  space_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  status: TaskStatus;
  due_date: string | null;
  priority: string | null;
  sort_order: number;
  tags: string[] | null;
  created_by: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const TASK_COLUMNS =
  'id, space_id, title, description, assignee_id, status, due_date, priority, sort_order, tags, created_by, completed_at, created_at, updated_at';

export interface TaskFields {
  title: string;
  description: string | null;
  assignee_id: string | null;
  due_date: string | null;
  priority: TaskPriority;
  tags: string[];
  status: TaskStatus;
}

interface TaskRowPatch {
  status?: TaskStatus;
  sort_order?: number;
  completed_at?: string | null;
}

interface MovePlan {
  draggedId: string;
  patches: Array<{ id: string; patch: TaskRowPatch }>;
}

function showError(error: unknown) {
  toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
}

/** completed_at feeds later reputation work: set on entering done, cleared on leaving it. */
function completedAtFor(status: TaskStatus): string | null {
  return status === 'done' ? new Date().toISOString() : null;
}

export function useSpaceTasks(spaceId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['space-tasks', spaceId];

  const tasksQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<BoardTask[]> => {
      const { data, error } = await supabase
        .from('space_tasks')
        .select(TASK_COLUMNS)
        .eq('space_id', spaceId!)
        .order('status')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({ ...row, sort_order: row.sort_order ?? 0 })) as BoardTask[];
    },
    enabled: !!spaceId,
  });

  const cached = () => queryClient.getQueryData<BoardTask[]>(queryKey) ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createTask = useMutation({
    mutationFn: async (input: TaskFields) => {
      const { error } = await supabase.from('space_tasks').insert({
        space_id: spaceId!,
        created_by: user!.id,
        title: input.title,
        description: input.description,
        assignee_id: input.assignee_id,
        due_date: input.due_date,
        priority: input.priority,
        tags: input.tags.length > 0 ? input.tags : null,
        status: input.status,
        sort_order: nextSortOrder(cached(), input.status),
        completed_at: completedAtFor(input.status),
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: showError,
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: TaskFields }) => {
      const current = cached().find((t) => t.id === id);
      const patch: TaskRowPatch & Partial<TaskFields> = {
        ...fields,
        tags: fields.tags.length > 0 ? fields.tags : [],
      };
      if (current && fields.status !== current.status) {
        patch.completed_at = completedAtFor(fields.status);
        patch.sort_order = nextSortOrder(cached(), fields.status);
      }
      // RLS silently updates zero rows when the caller lacks rights, so
      // surface that as an explicit error instead of a phantom success.
      const { data, error } = await supabase
        .from('space_tasks')
        .update(patch)
        .eq('id', id)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Only space leads, the task creator, or the assignee can edit this task.');
      }
    },
    onSuccess: invalidate,
    onError: showError,
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('space_tasks')
        .delete()
        .eq('id', id)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Only space leads or the task creator can delete this task.');
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success('Task deleted.');
    },
    onError: showError,
  });

  const moveMutation = useMutation({
    mutationFn: async ({ draggedId, patches }: MovePlan) => {
      const dragged = patches.find((p) => p.id === draggedId);
      if (dragged) {
        const { data, error } = await supabase
          .from('space_tasks')
          .update(dragged.patch)
          .eq('id', dragged.id)
          .select('id');
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('Only space leads, the task creator, or the assignee can move this task.');
        }
      }
      // Sibling resequencing is best-effort: RLS may deny writes to tasks the
      // caller doesn't own; the settle-time refetch restores the true order.
      await Promise.all(
        patches
          .filter((p) => p.id !== draggedId)
          .map((p) => supabase.from('space_tasks').update(p.patch).eq('id', p.id)),
      );
    },
    onMutate: async ({ patches }: MovePlan) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = cached();
      const patchMap = new Map(patches.map((p) => [p.id, p.patch]));
      queryClient.setQueryData<BoardTask[]>(queryKey, (old = []) =>
        old.map((t) => {
          const patch = patchMap.get(t.id);
          return patch ? { ...t, ...patch } : t;
        }),
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context) queryClient.setQueryData(queryKey, context.previous);
      showError(error);
    },
    onSettled: invalidate,
  });

  /** Optimistically move a task to a column position (drag or fallback control). */
  const moveTask = (id: string, toStatus: TaskStatus, toIndex: number) => {
    const tasks = cached();
    const current = tasks.find((t) => t.id === id);
    if (!current) return;
    const patches: MovePlan['patches'] = planMove(tasks, id, toStatus, toIndex);
    if (patches.length === 0) return;
    if (current.status !== toStatus) {
      const dragged = patches.find((p) => p.id === id);
      if (dragged) dragged.patch.completed_at = completedAtFor(toStatus);
    }
    moveMutation.mutate({ draggedId: id, patches });
  };

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    isError: tasksQuery.isError,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
  };
}
