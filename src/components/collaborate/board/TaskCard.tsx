import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { CalendarDays, MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { BoardTask } from '@/hooks/collaborate/useSpaceTasks';
import type { RosterMember } from '@/hooks/collaborate/useSpaceRoster';
import { memberInitials, memberName } from '@/hooks/collaborate/useSpaceRoster';
import { STATUS_LABEL, TASK_STATUSES } from '@/hooks/collaborate/boardOrdering';
import type { TaskStatus } from '@/types/collaborate';

const PRIORITY_CHIP: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', className: 'bg-dna-gold-light text-dna-gold-dark' },
  high: { label: 'High', className: 'bg-destructive/10 text-destructive' },
};

const MAX_VISIBLE_TAGS = 3;

interface TaskCardBodyProps {
  task: BoardTask;
  assignee?: RosterMember;
  /** Touch-friendly fallback for drag: "Move to …" menu on the card. */
  onMove?: (taskId: string, toStatus: TaskStatus) => void;
}

function TaskCardBody({ task, assignee, onMove }: TaskCardBodyProps) {
  const overdue =
    !!task.due_date && task.status !== 'done' && task.due_date < format(new Date(), 'yyyy-MM-dd');
  const priority = PRIORITY_CHIP[task.priority ?? 'medium'];
  const tags = task.tags ?? [];
  const assigneeName = assignee ? memberName(assignee) : null;

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground">
          {task.title}
        </p>
        {onMove && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-mr-1 -mt-1 h-7 w-7 shrink-0 text-muted-foreground"
                aria-label="Task actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel>Move to</DropdownMenuLabel>
              {TASK_STATUSES.filter((s) => s !== task.status).map((s) => (
                <DropdownMenuItem key={s} onSelect={() => onMove(task.id, s)}>
                  {STATUS_LABEL[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {(task.priority || tags.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {priority && (
            <Badge className={cn('border-transparent', priority.className)}>{priority.label}</Badge>
          )}
          {tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
            <Badge key={tag} variant="outline" className="font-normal">
              {tag}
            </Badge>
          ))}
          {tags.length > MAX_VISIBLE_TAGS && (
            <span className="text-xs text-muted-foreground">+{tags.length - MAX_VISIBLE_TAGS}</span>
          )}
        </div>
      )}

      {(task.due_date || assignee) && (
        <div className="mt-2 flex items-center justify-between gap-2">
          {task.due_date ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs',
                overdue ? 'font-medium text-destructive' : 'text-muted-foreground',
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {format(new Date(`${task.due_date}T00:00:00`), 'MMM d')}
              {overdue && ' · Overdue'}
            </span>
          ) : (
            <span />
          )}
          {assignee && assigneeName && (
            <Avatar className="h-6 w-6" title={assigneeName}>
              {assignee.avatar_url && <AvatarImage src={assignee.avatar_url} alt={assigneeName} />}
              <AvatarFallback className="text-[10px]">
                {memberInitials(assigneeName)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}
    </>
  );
}

/** Non-interactive card rendered inside the DragOverlay while dragging. */
export function TaskCardPreview({ task, assignee }: TaskCardBodyProps) {
  return (
    <Card className="p-3 shadow-lg">
      <TaskCardBody task={task} assignee={assignee} />
    </Card>
  );
}

interface TaskCardProps extends TaskCardBodyProps {
  onOpen: (task: BoardTask) => void;
  onMove: (taskId: string, toStatus: TaskStatus) => void;
}

export function TaskCard({ task, assignee, onOpen, onMove }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
      className={cn(
        'cursor-grab touch-manipulation p-3 transition-colors hover:bg-muted/40 active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
    >
      <TaskCardBody task={task} assignee={assignee} onMove={onMove} />
    </Card>
  );
}
