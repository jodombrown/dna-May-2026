import { MoreHorizontal, Edit2, Trash2, Pin, MessageSquareOff, Link, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePostActions } from '@/hooks/usePostActions';
import { resolvePostForEdit } from '@/lib/postEditResolver';
import { useEdit } from '@/contexts/EditContext';

/** The fields resolvePostForEdit reads. The card already holds all of them. */
type EditableItem = Parameters<typeof resolvePostForEdit>[0];

interface PostMenuOwnProps {
  postId: string;
  authorId: string;
  currentUserId: string;
  content: string;
  isPinned?: boolean;
  commentsDisabled?: boolean;
  onUpdate?: () => void;
  /**
   * The full feed item (or at least the fields resolvePostForEdit needs). The
   * menu resolves the edit target itself and opens the edit surface for
   * posts-backed verbs; for deferred targets (space/need/event) and refusals
   * the Edit item is HIDDEN, never shown-then-refused (BD165).
   */
  item: EditableItem;
}

export function PostMenuOwn({
  postId,
  authorId,
  currentUserId,
  content,
  isPinned = false,
  commentsDisabled = false,
  onUpdate,
  item,
}: PostMenuOwnProps) {
  const { openEdit } = useEdit();
  const {
    deletePost,
    togglePin,
    toggleComments,
    copyLink,
  } = usePostActions(postId, authorId, currentUserId);

  // Only posts-backed verbs and reshare commentary have a landing surface. Every
  // other target is deferred, so its Edit affordance is not rendered at all.
  const plan = resolvePostForEdit(item);
  const canEdit = plan.target === 'posts' || plan.target === 'commentary';

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
      deletePost.mutate(undefined, {
        onSuccess: () => onUpdate?.(),
      });
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
          {canEdit && (
            <DropdownMenuItem onClick={() => openEdit(item)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit post
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => togglePin.mutate(!isPinned)}>
            <Pin className="h-4 w-4 mr-2" />
            {isPinned ? 'Unpin from profile' : 'Pin to profile'}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => toggleComments.mutate(!commentsDisabled)}>
            {commentsDisabled ? (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Turn on comments
              </>
            ) : (
              <>
                <MessageSquareOff className="h-4 w-4 mr-2" />
                Turn off comments
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={copyLink}>
            <Link className="h-4 w-4 mr-2" />
            Copy link
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete post
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
