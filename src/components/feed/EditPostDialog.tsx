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
import { Loader2, Edit3 } from 'lucide-react';

interface EditPostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
  initialContent: string;
}

export const EditPostDialog = ({
  isOpen,
  onClose,
  onSave,
  initialContent,
}: EditPostDialogProps) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const MAX_CHARS = 5000;

  // Reset content when modal opens
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
    }
  }, [isOpen, initialContent]);

  const handleSave = async () => {
    if (content.trim().length === 0 || content.length > MAX_CHARS) return;

    setIsSaving(true);
    try {
      await onSave(content);
      onClose();
    } catch (error) {
      // Error handling delegated to parent component
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setContent(initialContent);
      onClose();
    }
  };

  const isOverLimit = content.length > MAX_CHARS;
  const hasChanges = content.trim() !== initialContent.trim();

  return (
    <ResponsiveModal open={isOpen} onOpenChange={handleClose} className="sm:max-w-[600px]">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2 text-xl font-semibold">
            <Edit3 className="h-5 w-5 text-dna-copper" />
            Edit Post
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Make changes to your post. Click save when you're done.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <div className="space-y-4 py-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="resize-none"
            placeholder="What's on your mind?"
            autoFocus
          />
          <div className="flex justify-between items-center">
            <p className={`text-xs ${
              isOverLimit
                ? 'text-red-500 font-semibold'
                : 'text-muted-foreground'
            }`}>
              {content.length}/{MAX_CHARS} characters
            </p>
            {hasChanges && (
              <p className="text-xs text-dna-copper font-medium">
                You have unsaved changes
              </p>
            )}
          </div>
        </div>

        <ResponsiveModalFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isOverLimit || !hasChanges || content.trim().length === 0}
            className="bg-dna-copper hover:bg-dna-gold text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Edit3 className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModal>
  );
};
