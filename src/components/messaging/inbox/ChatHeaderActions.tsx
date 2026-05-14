import React from 'react';
import {
  Search,
  Image as ImageIcon,
  User,
  MoreHorizontal,
  Ban,
  Flag,
  Timer,
} from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatHeaderActionsProps {
  username: string;
  onShowSharedMedia: () => void;
  onSearch: () => void;
  /** Phase 10 safety actions */
  onBlockToggle?: () => void;
  onReport?: () => void;
  onDisappearing?: () => void;
  /** Phase 12 - DIA Catch-me-up summary */
  onCatchMeUp?: () => void;
  /** Phase 13 - DIA messaging settings */
  onDiaSettings?: () => void;
  isBlocked?: boolean;
}

/**
 * Quick-action row under the chat header.
 * Profile, Shared media, in-thread Search (Phase 8), and a More menu (Phase 10:
 * block/unblock, report, disappearing messages).
 */
export const ChatHeaderActions: React.FC<ChatHeaderActionsProps> = ({
  username,
  onShowSharedMedia,
  onSearch,
  onBlockToggle,
  onReport,
  onDisappearing,
  onCatchMeUp,
  onDiaSettings,
  isBlocked,
}) => {
  const navigate = useNavigate();

  const Item = ({
    icon,
    label,
    onClick,
  }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const hasMoreMenu = !!(onBlockToggle || onReport || onDisappearing || onCatchMeUp || onDiaSettings);

  return (
    <div className="flex items-stretch gap-px border-b border-border bg-background">
      <Item
        icon={<User className="h-4 w-4" />}
        label="Profile"
        onClick={() => navigate(`/dna/${username}`)}
      />
      <Item
        icon={<ImageIcon className="h-4 w-4" />}
        label="Shared"
        onClick={onShowSharedMedia}
      />
      <Item
        icon={<Search className="h-4 w-4" />}
        label="Search"
        onClick={onSearch}
      />
      {hasMoreMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span>More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {onCatchMeUp && (
              <DropdownMenuItem onClick={onCatchMeUp}>
                <MateMasie className="h-4 w-4 mr-2 text-primary" /> Catch me up
              </DropdownMenuItem>
            )}
            {onDiaSettings && (
              <DropdownMenuItem onClick={onDiaSettings}>
                <MateMasie className="h-4 w-4 mr-2 text-primary" /> DIA settings
              </DropdownMenuItem>
            )}
            {(onCatchMeUp || onDiaSettings) && (onDisappearing || onReport || onBlockToggle) && <DropdownMenuSeparator />}
            {onDisappearing && (
              <DropdownMenuItem onClick={onDisappearing}>
                <Timer className="h-4 w-4 mr-2" /> Disappearing messages
              </DropdownMenuItem>
            )}
            {onDisappearing && (onBlockToggle || onReport) && <DropdownMenuSeparator />}
            {onReport && (
              <DropdownMenuItem onClick={onReport}>
                <Flag className="h-4 w-4 mr-2" /> Report
              </DropdownMenuItem>
            )}
            {onBlockToggle && (
              <DropdownMenuItem
                onClick={onBlockToggle}
                className={isBlocked ? '' : 'text-destructive focus:text-destructive'}
              >
                <Ban className="h-4 w-4 mr-2" />
                {isBlocked ? 'Unblock' : 'Block'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
