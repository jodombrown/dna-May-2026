import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Brain,
  Calendar,
  Users,
  Lightbulb,
  MessageSquare,
  UserPlus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CulturalPattern } from '@/components/shared/CulturalPattern';
import type { PostConnectionNudge } from '@/lib/dia/postConnectionNudges';

interface PostConnectionNudgeCardProps {
  connectedUserName: string;
  connectedUserAvatar?: string;
  connectedUserHeadline?: string;
  nudges: PostConnectionNudge[];
  onDismiss: () => void;
  className?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Calendar,
  Users,
  Lightbulb,
  MessageSquare,
  UserPlus,
};

const TARGET_C_COLORS: Record<string, string> = {
  CONVENE: 'text-amber-600 dark:text-amber-400',
  COLLABORATE: 'text-blue-600 dark:text-blue-400',
  CONTRIBUTE: 'text-emerald-600 dark:text-emerald-400',
  CONNECT: 'text-primary',
  MESSAGING: 'text-copper-600 dark:text-copper-400',
};

/**
 * PostConnectionNudgeCard — DIA intelligence card shown after a connection is accepted.
 * Surfaces 1-3 contextual next-action nudges that bridge into other C modules.
 */
export const PostConnectionNudgeCard: React.FC<PostConnectionNudgeCardProps> = ({
  connectedUserName,
  connectedUserAvatar,
  connectedUserHeadline,
  nudges,
  onDismiss,
  className,
}) => {
  const navigate = useNavigate();

  if (nudges.length === 0) return null;

  const initials = connectedUserName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-800 bg-card shadow-md',
        className,
      )}
    >
      {/* Adinkra pattern background */}
      <CulturalPattern pattern="adinkra" opacity={0.06} />

      {/* Left accent border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />

      <div className="relative p-4">
        {/* Header: DIA brain icon + dismiss */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <Brain className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              DIA Suggestion
            </span>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-full hover:bg-muted transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Connected user info */}
        <div className="flex items-center gap-2.5 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={connectedUserAvatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{connectedUserName}</p>
            {connectedUserHeadline && (
              <p className="text-xs text-muted-foreground truncate">
                {connectedUserHeadline}
              </p>
            )}
          </div>
        </div>

        {/* Nudge list */}
        <div className="space-y-2">
          {nudges.map((nudge, idx) => {
            const Icon = ICON_MAP[nudge.icon] || MessageSquare;
            const colorClass = TARGET_C_COLORS[nudge.targetC] || 'text-primary';

            return (
              <div
                key={`${nudge.type}-${idx}`}
                className="flex items-start gap-2.5"
              >
                <div
                  className={cn(
                    'mt-0.5 h-5 w-5 flex-shrink-0 flex items-center justify-center',
                    colorClass,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] leading-snug text-foreground">
                    {nudge.description}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1.5 h-7 text-xs px-3 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 min-h-[44px] sm:min-h-0"
                    onClick={() => navigate(nudge.ctaRoute)}
                  >
                    {nudge.ctaLabel}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default PostConnectionNudgeCard;
