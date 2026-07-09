/**
 * DNA | FEED - Reshare Dialog
 *
 * Allows users to reshare posts with optional commentary.
 * Implements the CONVEY principle for content amplification.
 *
 * Mobile: renders as a Vaul bottom sheet via ResponsiveModal so focusing
 * the textarea (and opening the keyboard) never shifts or clips the layout.
 */

import React, { useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Loader2, Repeat2 } from 'lucide-react';
import { UniversalFeedItem } from '@/types/feed';
import { formatDistanceToNow } from 'date-fns';

interface ReshareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: UniversalFeedItem;
  currentUserId: string;
  onReshare?: (commentary?: string) => void;
  isLoading?: boolean;
  // Legacy prop for backwards compatibility
  onSuccess?: () => void;
}

export const ReshareDialog: React.FC<ReshareDialogProps> = ({
  open,
  onOpenChange,
  post,
  currentUserId,
  onReshare,
  isLoading = false,
  onSuccess,
}) => {
  const [commentary, setCommentary] = useState('');

  const handleSubmit = () => {
    if (onReshare) {
      onReshare(commentary.trim() || undefined);
    } else if (onSuccess) {
      onSuccess();
    }
  };

  const handleQuickReshare = () => {
    if (onReshare) {
      onReshare(undefined);
    } else if (onSuccess) {
      onSuccess();
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setCommentary('');
    }
    onOpenChange(next);
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleOpenChange}
      className="sm:max-w-[600px]"
    >
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>Share this post</ResponsiveModalTitle>
        <ResponsiveModalDescription>
          Add your thoughts (optional) and share with your network
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <div className="space-y-4 px-4">
        {/* Commentary Input */}
        <div>
          <Textarea
            placeholder="What are your thoughts on this?"
            value={commentary}
            onChange={(e) => setCommentary(e.target.value)}
            className="min-h-[100px] w-full resize-none"
            maxLength={500}
          />
          <p className="mt-1 text-xs text-muted-foreground text-right">
            {commentary.length}/500
          </p>
        </div>

        {/* Original Post Preview */}
        <Card className="w-full min-w-0 overflow-hidden p-4 bg-muted/50">
          <div className="flex gap-3 mb-3 min-w-0">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={post.author_avatar_url || undefined} />
              <AvatarFallback>{post.author_display_name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {post.author_display_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                @{post.author_username} · {formatDistanceToNow(new Date(post.created_at))} ago
              </p>
            </div>
          </div>

          <p className="text-sm line-clamp-4 break-words">{post.content}</p>

          {post.media_url && (
            <img
              src={post.media_url}
              alt="Post media"
              className="mt-3 rounded-lg w-full max-h-[200px] object-cover"
            />
          )}
        </Card>
      </div>

      <ResponsiveModalFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          onClick={handleQuickReshare}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Repeat2 className="w-4 h-4 mr-2" />
          )}
          Quick Reshare
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Repeat2 className="w-4 h-4 mr-2" />
          )}
          Reshare
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
};
