import { useState } from 'react';
import { MoreHorizontal, Link, Flag, EyeOff, VolumeX, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePostActions } from '@/hooks/usePostActions';
import { ReportDialog } from './ReportDialog';
import { toast } from 'sonner';

interface PostMenuOthersProps {
  postId: string;
  authorId: string;
  authorName: string;
  currentUserId: string;
  onUpdate?: () => void;
  /**
   * Override URL for the "Copy link" action. Use for announcement posts
   * that should share the linked entity's public page instead of /post/{id}.
   */
  copyLinkHref?: string;
}

export function PostMenuOthers({
  postId,
  authorId,
  authorName,
  currentUserId,
  onUpdate,
  copyLinkHref,
}: PostMenuOthersProps) {
  const [showReportDialog, setShowReportDialog] = useState(false);

  const {
    isMuted,
    reportPost,
    hidePost,
    muteAuthor,
    unmuteAuthor,
    copyLink,
  } = usePostActions(postId, authorId, currentUserId);

  const handleHide = () => {
    hidePost.mutate(undefined, {
      onSuccess: () => onUpdate?.(),
    });
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      unmuteAuthor.mutate(undefined, {
        onSuccess: () => onUpdate?.(),
      });
    } else {
      if (confirm(`Are you sure you want to mute ${authorName}? You won't see their posts in your feed.`)) {
        muteAuthor.mutate(undefined, {
          onSuccess: () => onUpdate?.(),
        });
      }
    }
  };

  const handleCopyLink = async () => {
    if (!copyLinkHref) {
      copyLink();
      return;
    }
    try {
      await navigator.clipboard.writeText(copyLinkHref);
      toast.success('Link copied');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleCopyLink}>
            <Link className="h-4 w-4 mr-2" />
            Copy link
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleHide}>
            <EyeOff className="h-4 w-4 mr-2" />
            Hide post
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleMuteToggle}>
            {isMuted ? (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                Unmute {authorName.split(' ')[0]}
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 mr-2" />
                Mute {authorName.split(' ')[0]}
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setShowReportDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Flag className="h-4 w-4 mr-2" />
            Report post
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        onSubmit={(reason, description) => {
          reportPost.mutate({ reason, description });
        }}
        type="post"
      />
    </>
  );
}
