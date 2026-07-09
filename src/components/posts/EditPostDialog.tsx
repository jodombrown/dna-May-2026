import { useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  initialContent: string;
  onSuccess?: () => void;
}

export function EditPostDialog({
  open,
  onOpenChange,
  postId,
  initialContent,
  onSuccess,
}: EditPostDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({ content: content.trim(), updated_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
      toast.success('Post updated');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to update post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-lg">
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>Edit post</ResponsiveModalTitle>
      </ResponsiveModalHeader>

      <div className="px-4 py-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={6}
          className="w-full resize-none"
        />
        <p className="text-xs text-muted-foreground mt-2 text-right">
          {content.length} characters
        </p>
      </div>

      <ResponsiveModalFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
          className="w-full sm:w-auto bg-dna-forest hover:bg-dna-forest/90"
        >
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
}
