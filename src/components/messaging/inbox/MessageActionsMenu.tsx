import React from 'react';
import { MoreVertical, Copy, Trash2, Flag, Reply, Pencil, Forward, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface MessageActionsMenuProps {
  messageId: string;
  content: string;
  isOwn: boolean;
  createdAt?: string;
  isStarred?: boolean;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  onReport?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onUnsend?: (messageId: string) => void;
  onForward?: (messageId: string) => void;
  onToggleStar?: (messageId: string) => void;
}

const FIFTEEN_MIN_MS = 15 * 60 * 1000;

export const MessageActionsMenu: React.FC<MessageActionsMenuProps> = ({
  messageId,
  content,
  isOwn,
  createdAt,
  isStarred,
  onDelete,
  onReply,
  onReport,
  onEdit,
  onUnsend,
  onForward,
  onToggleStar,
}) => {
  const { toast } = useToast();

  const canEdit =
    isOwn &&
    !!onEdit &&
    !!createdAt &&
    Date.now() - new Date(createdAt).getTime() < FIFTEEN_MIN_MS;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({ title: 'Copied', description: 'Message copied to clipboard' });
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Message actions"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isOwn ? 'end' : 'start'} className="w-48">
        {onReply && (
          <DropdownMenuItem onClick={() => onReply(messageId)}>
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </DropdownMenuItem>
        )}

        {onForward && (
          <DropdownMenuItem onClick={() => onForward(messageId)}>
            <Forward className="h-4 w-4 mr-2" />
            Forward
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </DropdownMenuItem>

        {onToggleStar && (
          <DropdownMenuItem onClick={() => onToggleStar(messageId)}>
            <Star className={`h-4 w-4 mr-2 ${isStarred ? 'fill-current' : ''}`} />
            {isStarred ? 'Unstar' : 'Star'}
          </DropdownMenuItem>
        )}

        {canEdit && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit?.(messageId)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          </>
        )}

        {isOwn && (onUnsend || onDelete) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => (onUnsend ? onUnsend(messageId) : onDelete?.(messageId))}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {onUnsend ? 'Unsend' : 'Delete'}
            </DropdownMenuItem>
          </>
        )}

        {!isOwn && onReport && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onReport(messageId)}>
              <Flag className="h-4 w-4 mr-2" />
              Report
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
