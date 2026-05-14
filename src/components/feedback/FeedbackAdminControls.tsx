import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mpatapo } from '@/components/icons/adinkra';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Pin, PinOff, Trash2, CircleDot, CheckCircle2, XCircle, Clock, AlertTriangle, Flag, Loader2 } from 'lucide-react';
import { feedbackService } from '@/services/feedbackService';
import type {
  FeedbackMessage,
  FeedbackStatus,
  FeedbackCategory,
  FeedbackPriority,
} from '@/types/feedback';
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
} from '@/types/feedback';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface FeedbackAdminControlsProps {
  message: FeedbackMessage;
  channelId: string;
}

const STATUS_OPTIONS: { value: FeedbackStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'open', label: 'Open', icon: <CircleDot className="h-4 w-4 text-blue-500" /> },
  { value: 'acknowledged', label: 'Acknowledged', icon: <CircleDot className="h-4 w-4 text-copper-500" /> },
  { value: 'in_progress', label: 'In Progress', icon: <Clock className="h-4 w-4 text-yellow-500" /> },
  { value: 'resolved', label: 'Resolved', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
  { value: 'closed', label: 'Closed', icon: <XCircle className="h-4 w-4 text-neutral-500" /> },
];

const CATEGORY_OPTIONS: { value: FeedbackCategory; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'ux', label: 'UX Issue' },
  { value: 'general', label: 'General' },
  { value: 'praise', label: 'Praise' },
];

const PRIORITY_OPTIONS: { value: FeedbackPriority; label: string; icon: React.ReactNode }[] = [
  { value: 'low', label: 'Low', icon: <Flag className="h-4 w-4 text-neutral-400" /> },
  { value: 'medium', label: 'Medium', icon: <Flag className="h-4 w-4 text-blue-500" /> },
  { value: 'high', label: 'High', icon: <Flag className="h-4 w-4 text-orange-500" /> },
  { value: 'critical', label: 'Critical', icon: <AlertTriangle className="h-4 w-4 text-red-500" /> },
];

export function FeedbackAdminControls({ message, channelId }: FeedbackAdminControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();

  const invalidateMessages = () => {
    queryClient.invalidateQueries({ queryKey: ['feedback-messages', channelId] });
  };

  const handleStatusChange = async (status: FeedbackStatus) => {
    setIsLoading(true);
    try {
      const success = await feedbackService.updateStatus(message.id, status);
      if (success) {
        toast.success(`Status updated to ${STATUS_LABELS[status]}`);
        invalidateMessages();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = async (category: FeedbackCategory) => {
    setIsLoading(true);
    try {
      const success = await feedbackService.updateCategory(message.id, category);
      if (success) {
        toast.success('Category updated');
        invalidateMessages();
      } else {
        throw new Error('Failed to update category');
      }
    } catch (error) {
      toast.error('Failed to update category');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriorityChange = async (priority: FeedbackPriority) => {
    setIsLoading(true);
    try {
      const success = await feedbackService.updatePriority(message.id, priority);
      if (success) {
        toast.success(`Priority set to ${PRIORITY_LABELS[priority]}`);
        invalidateMessages();
      } else {
        throw new Error('Failed to update priority');
      }
    } catch (error) {
      toast.error('Failed to update priority');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePin = async () => {
    setIsLoading(true);
    try {
      const success = await feedbackService.togglePin(message.id, !message.is_pinned);
      if (success) {
        toast.success(message.is_pinned ? 'Message unpinned' : 'Message pinned');
        invalidateMessages();
      } else {
        throw new Error('Failed to toggle pin');
      }
    } catch (error) {
      toast.error('Failed to toggle pin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleHighlight = async () => {
    setIsLoading(true);
    try {
      const success = await feedbackService.toggleHighlight(message.id, !message.is_highlighted);
      if (success) {
        toast.success(message.is_highlighted ? 'Highlight removed' : 'Message highlighted');
        invalidateMessages();
      } else {
        throw new Error('Failed to toggle highlight');
      }
    } catch (error) {
      toast.error('Failed to toggle highlight');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const success = await feedbackService.softDelete(message.id);
      if (success) {
        toast.success('Message deleted');
        invalidateMessages();
        setShowDeleteDialog(false);
      } else {
        throw new Error('Failed to delete message');
      }
    } catch (error) {
      toast.error('Failed to delete message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Status */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <CircleDot className="h-4 w-4 mr-2" />
              Status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {STATUS_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={message.status === option.value ? 'bg-accent' : ''}
                >
                  {option.icon}
                  <span className="ml-2">{option.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Category */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Flag className="h-4 w-4 mr-2" />
              Category
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent sideOffset={8} alignOffset={-5}>
              {CATEGORY_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={(e) => {
                    e.preventDefault();
                    handleCategoryChange(option.value);
                  }}
                  className={message.category === option.value ? 'bg-accent' : ''}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Priority */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Priority
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {PRIORITY_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handlePriorityChange(option.value)}
                  className={message.priority === option.value ? 'bg-accent' : ''}
                >
                  {option.icon}
                  <span className="ml-2">{option.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Pin */}
          <DropdownMenuItem onClick={handleTogglePin}>
            {message.is_pinned ? (
              <>
                <PinOff className="h-4 w-4 mr-2" />
                Unpin
              </>
            ) : (
              <>
                <Pin className="h-4 w-4 mr-2" />
                Pin to Top
              </>
            )}
          </DropdownMenuItem>

          {/* Highlight */}
          <DropdownMenuItem onClick={handleToggleHighlight}>
            <Mpatapo className="h-4 w-4 mr-2" />
            {message.is_highlighted ? 'Remove Highlight' : 'Highlight'}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Delete */}
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this feedback? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                await handleDelete();
              }}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
