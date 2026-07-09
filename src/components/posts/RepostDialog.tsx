import React, { useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { PostWithAuthor } from '@/types/posts';
import { Loader2, Repeat2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RepostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostWithAuthor;
  currentUserName: string;
  currentUserAvatar?: string;
  onRepost: (commentary?: string) => Promise<void>;
}

export const RepostDialog: React.FC<RepostDialogProps> = ({
  isOpen,
  onClose,
  post,
  currentUserName,
  currentUserAvatar,
  onRepost,
}) => {
  const [commentary, setCommentary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRepost = async () => {
    setIsSubmitting(true);
    try {
      await onRepost(commentary.trim() || undefined);
      setCommentary('');
      onClose();
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={(o) => !o && onClose()} className="sm:max-w-2xl">
      <ResponsiveModalHeader>
        <ResponsiveModalTitle className="flex items-center gap-2">
          <Repeat2 className="h-5 w-5" />
          Share this post
        </ResponsiveModalTitle>
      </ResponsiveModalHeader>

      <div className="space-y-4 px-4">
        {/* Current user section */}
        <div className="flex items-start gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={currentUserAvatar} alt={currentUserName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(currentUserName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm mb-2 truncate">{currentUserName}</p>
            <Textarea
              placeholder="Add your thoughts (optional)..."
              value={commentary}
              onChange={(e) => setCommentary(e.target.value)}
              className="min-h-[100px] w-full resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {commentary.length}/500
            </p>
          </div>
        </div>

        {/* Original post preview */}
        <Card className="w-full min-w-0 overflow-hidden p-4 border-l-4 border-l-primary/50 bg-muted/30">
          <div className="flex items-start gap-3 mb-3 min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={post.author_avatar_url} alt={post.author_full_name} />
              <AvatarFallback className="bg-[hsl(151,75%,50%)] text-white text-xs">
                {getInitials(post.author_full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{post.author_full_name}</p>
              {post.author_headline && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {post.author_headline}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          <p className="text-sm whitespace-pre-wrap line-clamp-4 break-words">{post.content}</p>

          {post.image_url && (
            <div className="mt-3 rounded-lg overflow-hidden border max-h-48">
              <img
                src={post.image_url}
                alt="Post preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </Card>
      </div>

      <ResponsiveModalFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          onClick={handleRepost}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sharing...
            </>
          ) : (
            <>
              <Repeat2 className="h-4 w-4 mr-2" />
              Share
            </>
          )}
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
};
