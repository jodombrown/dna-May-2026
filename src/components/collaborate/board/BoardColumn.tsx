import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TaskCard } from './TaskCard';
import type { BoardTask } from '@/hooks/collaborate/useSpaceTasks';
import type { RosterMember } from '@/hooks/collaborate/useSpaceRoster';
import { STATUS_LABEL } from '@/hooks/collaborate/boardOrdering';
import type { TaskStatus } from '@/types/collaborate';

interface BoardColumnProps {
  status: TaskStatus;
  tasks: BoardTask[];
  membersById: Map<string, RosterMember>;
  onAddTask: (status: TaskStatus) => void;
  onOpenTask: (task: BoardTask) => void;
  onMoveTask: (taskId: string, toStatus: TaskStatus) => void;
}

export function BoardColumn({
  status,
  tasks,
  membersById,
  onAddTask,
  onOpenTask,
  onMoveTask,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      className="flex w-[78vw] max-w-[320px] shrink-0 snap-start flex-col rounded-lg bg-muted/40 sm:w-auto sm:max-w-none"
      aria-label={`${STATUS_LABEL[status]} column`}
    >
      <header className="flex items-center justify-between px-3 pt-3">
        <h2 className="text-sm font-semibold text-foreground">
          {STATUS_LABEL[status]}
          <span className="ml-2 text-xs font-medium text-muted-foreground">{tasks.length}</span>
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          aria-label={`Add task to ${STATUS_LABEL[status]}`}
          onClick={() => onAddTask(status)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </header>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'flex min-h-[8rem] flex-1 flex-col gap-2 rounded-b-lg p-3 transition-colors',
            isOver && 'bg-muted/70',
          )}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assignee={task.assignee_id ? membersById.get(task.assignee_id) : undefined}
              onOpen={onOpenTask}
              onMove={onMoveTask}
            />
          ))}
          {tasks.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No tasks here yet. Drag one over or add one.
            </p>
          )}
        </div>
      </SortableContext>

      <div className="px-3 pb-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => onAddTask(status)}
        >
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
          Add task
        </Button>
      </div>
    </section>
  );
}
