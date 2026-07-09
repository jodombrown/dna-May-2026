import { useState, useEffect } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Repeat2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

interface ReshareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReshare: (commentary: string) => Promise<void>;
  originalPost: {
    id: string;
    author_name: string;
    author_avatar: string | null;
    content: string;
    media_url: string | null;
  } | null;
}

export const ReshareDialog = ({
  isOpen,
  onClose,
  onReshare,
  originalPost,
}: ReshareDialogProps) => {
  const [commentary, setCommentary] = useState('');
  const [isResharing, setIsResharing] = useState(false);
  const MAX_CHARS = 500;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCommentary('');
    }
  }, [isOpen]);

  const handleReshare = async () => {
    if (commentary.length > MAX_CHARS) return;

    setIsResharing(true);
    try {
      await onReshare(commentary);
      setCommentary('');
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsResharing(false);
    }
  };

  const handleClose = () => {
    if (!isResharing) {
      setCommentary('');
      onClose();
    }
  };

  const isOverLimit = commentary.length > MAX_CHARS;

  if (!originalPost) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-[hsl(30,10%,10%)]">
            <Repeat2 className="h-5 w-5 text-dna-copper" />
            Reshare Post
          </DialogTitle>
          <DialogDescription className="text-[hsl(30,10%,60%)]">
            Add your thoughts and share this post with your network
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Commentary Input */}
          <div className="space-y-2">
            <Label htmlFor="commentary" className="text-sm font-medium text-[hsl(30,10%,10%)]">
              Your commentary (optional)
            </Label>
            <Textarea
              id="commentary"
              placeholder="What do you think about this? Add your perspective..."
              value={commentary}
              onChange={(e) => setCommentary(e.target.value)}
              rows={4}
              className="resize-none border-[hsl(30,10%,80%)] focus:border-[hsl(151,75%,50%)]"
              autoFocus
            />
            <p className={`text-xs text-right ${
              isOverLimit
                ? 'text-red-500 font-semibold'
                : 'text-[hsl(30,10%,60%)]'
            }`}>
              {commentary.length}/{MAX_CHARS} characters
            </p>
          </div>

          {/* Original Post Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[hsl(30,10%,60%)]">
              Original post:
            </Label>
            <Card className="p-4 bg-muted/30 border-l-4 border-l-dna-copper/50">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={originalPost.author_avatar || undefined} />
                  <AvatarFallback>{originalPost.author_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">
                    {originalPost.author_name}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-4">
                    {originalPost.content}
                  </p>
                  {originalPost.media_url && (
                    <div className="mt-2">
                      <img
                        src={originalPost.media_url}
                        alt="Post media"
                        className="rounded-lg max-h-32 object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isResharing}
            className="border-[hsl(30,10%,80%)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleReshare}
            disabled={isResharing || isOverLimit}
            className="bg-dna-copper hover:bg-dna-gold text-white"
          >
            {isResharing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resharing...
              </>
            ) : (
              <>
                <Repeat2 className="mr-2 h-4 w-4" />
                Reshare Post
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
