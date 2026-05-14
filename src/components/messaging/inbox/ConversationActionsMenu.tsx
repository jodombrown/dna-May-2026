import React, { useState } from 'react';
import { MoreVertical, User, BellOff, Bell, Trash2, Ban, Flag, Archive, Pin, PinOff, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { messagingSafetyService } from '@/services/messagingSafetyService';

interface ConversationActionsMenuProps {
  otherUser: {
    id: string;
    username: string;
    full_name: string;
  };
  conversationId: string;
  isMuted?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  onMuteToggle?: () => void;
  onPinToggle?: () => void;
  onArchiveToggle?: () => void;
  onDeleteConversation?: () => void;
  onBlockUser?: () => void;
  onReportUser?: () => void;
}

export const ConversationActionsMenu: React.FC<ConversationActionsMenuProps> = ({
  otherUser,
  conversationId,
  isMuted = false,
  isPinned = false,
  isArchived = false,
  onMuteToggle,
  onPinToggle,
  onArchiveToggle,
  onDeleteConversation,
  onBlockUser,
  onReportUser,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleViewProfile = () => {
    navigate(`/dna/${otherUser.username}`);
  };

  const handleMuteToggle = () => onMuteToggle?.();
  const handlePinToggle = () => onPinToggle?.();
  const handleArchiveToggle = () => onArchiveToggle?.();

  const handleDeleteConversation = () => {
    onDeleteConversation?.();
    setShowDeleteDialog(false);
  };

  const handleConfirmBlock = async () => {
    setIsSubmitting(true);
    try {
      if (onBlockUser) {
        onBlockUser();
      } else {
        await messagingSafetyService.blockUser(otherUser.id);
      }
      toast({
        title: `Blocked ${otherUser.full_name}`,
        description: 'They will no longer be able to message you.',
      });
      setShowBlockDialog(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      toast({ title: 'Could not block user', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReport = async () => {
    if (!reportReason.trim()) {
      toast({ title: 'Pick a reason', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      if (onReportUser) {
        onReportUser();
      } else {
        await messagingSafetyService.reportUser({
          targetUserId: otherUser.id,
          conversationId,
          reason: reportReason,
          details: reportDetails.trim() || undefined,
        });
      }
      toast({ title: 'Report submitted', description: 'Our team will review it shortly.' });
      setShowReportDialog(false);
      setReportReason('');
      setReportDetails('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      toast({ title: 'Could not submit report', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleViewProfile}>
            <User className="h-4 w-4 mr-2" />
            View Profile
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handlePinToggle}>
            {isPinned ? (
              <>
                <PinOff className="h-4 w-4 mr-2" />
                Unpin Conversation
              </>
            ) : (
              <>
                <Pin className="h-4 w-4 mr-2" />
                Pin Conversation
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleArchiveToggle}>
            {isArchived ? (
              <>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Unarchive Conversation
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Archive Conversation
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleMuteToggle}>
            {isMuted ? (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Unmute Notifications
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4 mr-2" />
                Mute Notifications
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Conversation
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowBlockDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Ban className="h-4 w-4 mr-2" />
            Block {otherUser.full_name}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
            <Flag className="h-4 w-4 mr-2" />
            Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the conversation from your inbox. The other person will still be able to see the messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {otherUser.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will no longer be able to message you or see your activity. You can unblock them later from settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBlock}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Blocking...' : 'Block'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report {otherUser.full_name}</DialogTitle>
            <DialogDescription>
              Tell us what's wrong. Reports are reviewed confidentially.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reason</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'spam', label: 'Spam' },
                  { id: 'harassment', label: 'Harassment' },
                  { id: 'inappropriate', label: 'Inappropriate content' },
                  { id: 'impersonation', label: 'Impersonation' },
                  { id: 'scam', label: 'Scam or fraud' },
                  { id: 'other', label: 'Other' },
                ].map((r) => (
                  <Button
                    key={r.id}
                    type="button"
                    variant={reportReason === r.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReportReason(r.id)}
                    className="justify-start"
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-details" className="text-sm font-medium">
                Additional context (optional)
              </Label>
              <Textarea
                id="report-details"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Add any details that help us investigate"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReport} disabled={isSubmitting || !reportReason}>
              {isSubmitting ? 'Submitting...' : 'Submit report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};