import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SpacesShell } from '@/components/collaborate/SpacesShell';
import { BoardColumn } from '@/components/collaborate/board/BoardColumn';
import { TaskCardPreview } from '@/components/collaborate/board/TaskCard';
import { TaskEditSheet } from '@/components/collaborate/board/TaskEditSheet';
import { useSpace } from '@/hooks/collaborate/useSpace';
import { useSpaceRoster } from '@/hooks/collaborate/useSpaceRoster';
import { useSpaceTasks, type BoardTask, type TaskFields } from '@/hooks/collaborate/useSpaceTasks';
import { TASK_STATUSES, groupByStatus } from '@/hooks/collaborate/boardOrdering';
import type { TaskStatus } from '@/types/collaborate';

function boardPath(slug: string): string {
  return `/dna/collaborate/spaces/${slug}/board`;
}

export default function SpaceBoard() {
  const { slug: param = '' } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { space, isLoading: spaceLoading, isError } = useSpace(param, boardPath);
  const { data: roster = [], isLoading: rosterLoading } = useSpaceRoster(space?.id);
  const { tasks, isLoading: tasksLoading, createTask, updateTask, deleteTask, moveTask } =
    useSpaceTasks(space?.id);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<BoardTask | null>(null);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('open');
  const [draggingTask, setDraggingTask] = useState<BoardTask | null>(null);

  const activeRoster = useMemo(() => roster.filter((m) => m.status === 'active'), [roster]);
  const membersById = useMemo(
    () => new Map(activeRoster.map((m) => [m.user_id, m])),
    [activeRoster],
  );
  const columns = useMemo(() => groupByStatus(tasks), [tasks]);
  const tagOptions = useMemo(
    () => [...new Set(tasks.flatMap((t) => t.tags ?? []))].sort(),
    [tasks],
  );

  const isMember = !!user && activeRoster.some((m) => m.user_id === user.id);

  // Mouse needs a small drag threshold so plain clicks still open the task;
  // touch uses press-and-hold so column scrolling keeps working on mobile.
  // No KeyboardSensor: Enter opens the task, and the card's "Move to" menu is
  // the keyboard/touch fallback for drag.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );

  const openCreate = (status: TaskStatus) => {
    setEditingTask(null);
    setCreateStatus(status);
    setSheetOpen(true);
  };

  const openEdit = (task: BoardTask) => {
    setEditingTask(task);
    setSheetOpen(true);
  };

  const handleSave = async (fields: TaskFields, taskId?: string) => {
    if (taskId) {
      await updateTask.mutateAsync({ id: taskId, fields });
    } else {
      await createTask.mutateAsync(fields);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingTask(tasks.find((t) => t.id === event.active.id) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const overId = String(over.id);

    if ((TASK_STATUSES as string[]).includes(overId)) {
      // Dropped on a column body: append to that column.
      const toStatus = overId as TaskStatus;
      moveTask(String(active.id), toStatus, columns[toStatus].length);
      return;
    }
    const overTask = tasks.find((t) => t.id === overId);
    if (!overTask) return;
    const toIndex = columns[overTask.status].findIndex((t) => t.id === overId);
    moveTask(String(active.id), overTask.status, Math.max(toIndex, 0));
  };

  if (spaceLoading) {
    return (
      <SpacesShell tabs={null}>
        <Skeleton className="h-8 w-1/2" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {TASK_STATUSES.map((s) => (
            <Skeleton key={s} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </SpacesShell>
    );
  }

  if (isError || !space) {
    return (
      <SpacesShell maxWidthClassName="max-w-3xl" tabs={null}>
        <Card className="p-8 text-center">
          <h1 className="text-lg font-semibold text-foreground">Space not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This space may have been removed, or you may not have access to it.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/dna/collaborate/spaces">Back to Spaces</Link>
          </Button>
        </Card>
      </SpacesShell>
    );
  }

  if (!rosterLoading && !isMember) {
    return (
      <SpacesShell maxWidthClassName="max-w-3xl" tabs={null}>
        <Card className="p-8 text-center">
          <h1 className="text-lg font-semibold text-foreground">Members only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The task board for {space.name} is visible to its members. Join the space to see and
            work on its tasks.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link to={`/dna/collaborate/spaces/${space.slug}`}>Go to the space page</Link>
          </Button>
        </Card>
      </SpacesShell>
    );
  }

  const boardEmpty = !tasksLoading && tasks.length === 0;

  return (
    <SpacesShell maxWidthClassName="max-w-5xl" tabs={null}>
      <Link
        to={`/dna/collaborate/spaces/${space.slug}`}
        className="mb-4 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
        {space.name}
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan and track {space.name}&rsquo;s work.
          </p>
        </div>
        <Button type="button" className="shrink-0" onClick={() => openCreate('open')}>
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
          New task
        </Button>
      </div>

      {tasksLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {TASK_STATUSES.map((s) => (
            <Skeleton key={s} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : boardEmpty ? (
        <Card className="mt-6 p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">Start the board</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Break the work into tasks your team can pick up. Add the first one and assign it to get
            things moving.
          </p>
          <Button type="button" className="mt-4" onClick={() => openCreate('open')}>
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            Add the first task
          </Button>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setDraggingTask(null)}
        >
          <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-3 sm:snap-none sm:overflow-visible">
            {TASK_STATUSES.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                tasks={columns[status]}
                membersById={membersById}
                onAddTask={openCreate}
                onOpenTask={openEdit}
                onMoveTask={(taskId, toStatus) =>
                  moveTask(taskId, toStatus, columns[toStatus].length)
                }
              />
            ))}
          </div>
          <DragOverlay>
            {draggingTask && (
              <TaskCardPreview
                task={draggingTask}
                assignee={
                  draggingTask.assignee_id ? membersById.get(draggingTask.assignee_id) : undefined
                }
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      <TaskEditSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        task={editingTask}
        defaultStatus={createStatus}
        roster={activeRoster}
        tagOptions={tagOptions}
        onSave={handleSave}
        onDelete={(id) => deleteTask.mutateAsync(id)}
        saving={createTask.isPending || updateTask.isPending}
        deleting={deleteTask.isPending}
      />
    </SpacesShell>
  );
}
