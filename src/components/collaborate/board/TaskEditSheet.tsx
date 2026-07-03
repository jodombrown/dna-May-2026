import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveModal,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { TagMultiSelect } from '@/components/ui/TagMultiSelect';
import type { BoardTask, TaskFields } from '@/hooks/collaborate/useSpaceTasks';
import type { RosterMember } from '@/hooks/collaborate/useSpaceRoster';
import { memberName } from '@/hooks/collaborate/useSpaceRoster';
import { STATUS_LABEL, TASK_STATUSES } from '@/hooks/collaborate/boardOrdering';
import type { TaskPriority, TaskStatus } from '@/types/collaborate';

const PRIORITIES: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const UNASSIGNED = 'unassigned';

interface TaskEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Task to edit, or null to create a new one. */
  task: BoardTask | null;
  /** Column a new task lands in (create mode). */
  defaultStatus: TaskStatus;
  roster: RosterMember[];
  tagOptions: string[];
  onSave: (fields: TaskFields, taskId?: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  saving: boolean;
  deleting: boolean;
}

export function TaskEditSheet({
  open,
  onOpenChange,
  task,
  defaultStatus,
  roster,
  tagOptions,
  onSave,
  onDelete,
  saving,
  deleting,
}: TaskEditSheetProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState(UNASSIGNED);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [titleError, setTitleError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setAssigneeId(task?.assignee_id ?? UNASSIGNED);
    setDueDate(task?.due_date ?? '');
    setPriority((task?.priority as TaskPriority) ?? 'medium');
    setTags(task?.tags ?? []);
    setStatus(task?.status ?? defaultStatus);
    setTitleError(false);
  }, [open, task, defaultStatus]);

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError(true);
      return;
    }
    try {
      await onSave(
        {
          title: trimmed,
          description: description.trim() || null,
          assignee_id: assigneeId === UNASSIGNED ? null : assigneeId,
          due_date: dueDate || null,
          priority,
          tags,
          status,
        },
        task?.id,
      );
      onOpenChange(false);
    } catch {
      // Error already surfaced via toast; keep the sheet open for retry.
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      await onDelete(task.id);
      onOpenChange(false);
    } catch {
      // Error already surfaced via toast.
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-lg">
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>{task ? 'Edit task' : 'New task'}</ResponsiveModalTitle>
        <ResponsiveModalDescription>
          {task
            ? 'Update the details, or move the task to another column.'
            : 'Give the task a clear title so teammates know what done looks like.'}
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <div className="max-h-[60dvh] space-y-4 overflow-y-auto px-4 py-1 sm:px-0">
        <div className="space-y-2">
          <Label htmlFor="task-title">Title</Label>
          <Input
            id="task-title"
            value={title}
            placeholder="What needs to get done?"
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError && e.target.value.trim()) setTitleError(false);
            }}
            aria-invalid={titleError}
            className={titleError ? 'border-destructive' : undefined}
          />
          {titleError && <p className="text-sm text-destructive">A title is required.</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-description">Description</Label>
          <Textarea
            id="task-description"
            value={description}
            rows={3}
            placeholder="Add context, links, or acceptance criteria (optional)"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Assignee</Label>
          <Select value={assigneeId} onValueChange={setAssigneeId}>
            <SelectTrigger aria-label="Assignee">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
              {roster.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {memberName(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="task-due">Due date</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger aria-label="Priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {task && (
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <TagMultiSelect
          label="Tags"
          options={tagOptions}
          selected={tags}
          onChange={setTags}
          placeholder="Add tags…"
          allowCustom
        />
      </div>

      <ResponsiveModalFooter className="gap-2 sm:justify-between">
        {task ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={deleting}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}
        <div className="flex gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 sm:flex-none"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? 'Saving…' : task ? 'Save changes' : 'Create task'}
          </Button>
        </div>
      </ResponsiveModalFooter>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={handleDelete}
        title="Delete this task?"
        description="The task and its details will be removed for everyone in the space. This can't be undone."
        confirmText="Delete task"
        variant="destructive"
      />
    </ResponsiveModal>
  );
}
