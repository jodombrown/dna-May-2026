/**
 * DNA | Sprint 11 - Share Menu
 *
 * Three sharing options:
 * - Share to Feed (with optional commentary)
 * - Share in Message (conversation picker)
 * - Copy Link
 *
 * Feed reshare creates attributed card.
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Newspaper, MessageCircle, Link2, Check } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================================
// TYPES
// ============================================================

interface ShareMenuProps {
  contentType: string;
  contentId: string;
  currentUserId: string;
  contentTitle?: string;
  authorName?: string;
  className?: string;
}

type ShareMode = 'feed' | 'message' | 'link';

// ============================================================
// COMPONENT
// ============================================================

export const ShareMenu: React.FC<ShareMenuProps> = ({
  contentType,
  contentId,
  currentUserId,
  contentTitle,
  authorName,
  className,
}) => {
  const [showFeedShareDialog, setShowFeedShareDialog] = useState(false);
  const [commentary, setCommentary] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const queryClient = useQueryClient();

  // ============================================================
  // SHARE TO FEED
  // ============================================================

  const shareMutation = useMutation({
    mutationFn: async (mode: ShareMode) => {
      if (!currentUserId) throw new Error('Not authenticated');

      const { error } = await supabase.from('feed_reshares').insert({
        user_id: currentUserId,
        content_type: contentType,
        content_id: contentId,
        commentary: mode === 'feed' ? commentary || null : null,
        shared_via: mode,
      });

      if (error) throw error;
    },
    onSuccess: (_, mode) => {
      if (mode === 'feed') {
        toast.success('Shared to your feed');
        setShowFeedShareDialog(false);
        setCommentary('');
      }
      queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
      queryClient.invalidateQueries({ queryKey: ['feed-scored'] });
    },
    onError: () => {
      toast.error('Failed to share. Please try again.');
    },
  });

  // ============================================================
  // COPY LINK
  // ============================================================

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/dna/${contentType}/${contentId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast.success('Link copied');
      // Track as link share
      shareMutation.mutate('link');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  // ============================================================
  // SHARE TO MESSAGE (placeholder - opens message flow)
  // ============================================================

  const handleShareToMessage = () => {
    // Track the share
    shareMutation.mutate('message');
    toast.success('Opening message...');
    // In a full implementation, this would open a ConversationPicker
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn('flex items-center gap-1.5 h-9 px-3 text-xs', className)}
          >
            <Share2 className="h-[18px] w-[18px]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setShowFeedShareDialog(true)}>
            <Newspaper className="h-4 w-4 mr-3" />
            <div>
              <p className="font-medium">Share to Feed</p>
              <p className="text-xs text-muted-foreground">Add commentary and share</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareToMessage}>
            <MessageCircle className="h-4 w-4 mr-3" />
            <div>
              <p className="font-medium">Share in Message</p>
              <p className="text-xs text-muted-foreground">Send to a conversation</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink}>
            {linkCopied ? (
              <Check className="h-4 w-4 mr-3 text-green-500" />
            ) : (
              <Link2 className="h-4 w-4 mr-3" />
            )}
            <div>
              <p className="font-medium">{linkCopied ? 'Copied!' : 'Copy Link'}</p>
              <p className="text-xs text-muted-foreground">Get a shareable link</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Feed Share Dialog */}
      <ResponsiveModal open={showFeedShareDialog} onOpenChange={setShowFeedShareDialog} className="sm:max-w-md">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>Share to Feed</ResponsiveModalTitle>
          </ResponsiveModalHeader>
          <div className="space-y-4">
            {/* Attribution preview */}
            {authorName && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">
                  Sharing {authorName}&apos;s {contentType}
                  {contentTitle && `: "${contentTitle}"`}
                </p>
              </div>
            )}

            {/* Commentary input */}
            <Textarea
              value={commentary}
              onChange={(e) => setCommentary(e.target.value)}
              placeholder="Add your thoughts (optional)"
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {commentary.length}/500
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFeedShareDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => shareMutation.mutate('feed')}
                disabled={shareMutation.isPending}
                className="bg-dna-emerald hover:bg-dna-emerald/90 text-white"
              >
                {shareMutation.isPending ? 'Sharing...' : 'Share'}
              </Button>
            </div>
          </div>
        </ResponsiveModal>
    </>
  );
};
