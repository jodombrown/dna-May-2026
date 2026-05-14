/**
 * Profile Badges — Displays earned achievement badges.
 *
 * Shows badges with glow animation for recently earned ones (< 7 days).
 * Respects tier limits on how many badges can be displayed.
 * Per PRD Section 6.1: max 5 displayed, 40px size, glow on recent.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Shield, Star, Users, Calendar, Layout, Heart, PenTool } from 'lucide-react';
import { Sankofa } from '@/components/icons/adinkra';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProfileBadge, BadgeType, CModule, UserTier } from '@/types/profileIdentityHub';
import { PROFILE_LAYOUT, PROFILE_TIER_GATES } from '@/types/profileIdentityHub';

interface ProfileBadgesProps {
  badges: ProfileBadge[];
  tier: UserTier;
  isOwner?: boolean;
  onToggleDisplay?: (badgeId: string, isDisplayed: boolean) => void;
}

const MODULE_ICONS: Record<CModule | 'cross_c', React.FC<{ className?: string }>> = {
  connect: Users,
  convene: Calendar,
  collaborate: Layout,
  contribute: Heart,
  convey: PenTool,
  cross_c: Star,
};

const MODULE_COLORS: Record<CModule | 'cross_c', string> = {
  connect: '#4A8D77',
  convene: '#C4942A',
  collaborate: '#2D5A3D',
  contribute: '#B87333',
  convey: '#2A7A8C',
  cross_c: '#7C3AED',
};

const MODULE_ROUTES: Record<CModule | 'cross_c', string> = {
  connect: '/dna/connect/network',
  convene: '/dna/convene/my-events',
  collaborate: '/dna/collaborate/my-spaces',
  contribute: '/dna/contribute/my',
  convey: '/dna/convey',
  cross_c: '/dna/feed',
};

export const ProfileBadges: React.FC<ProfileBadgesProps> = ({
  badges,
  tier,
  isOwner = false,
  onToggleDisplay,
}) => {
  const navigate = useNavigate();
  const { badges: badgeLayout } = PROFILE_LAYOUT;
  const maxDisplayed = PROFILE_TIER_GATES[tier].badgeDisplayMax;
  const displayedBadges = badges
    .filter((b) => b.isDisplayed)
    .slice(0, maxDisplayed);

  if (displayedBadges.length === 0 && !isOwner) return null;

  const isRecent = (earnedAt: Date): boolean => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Date(earnedAt).getTime() > sevenDaysAgo;
  };

  return (
    <div>
      <h3
        className="text-sm font-semibold mb-3"
        style={{ color: PROFILE_LAYOUT.section.titleColor }}
      >
        Badges
      </h3>

      {displayedBadges.length === 0 ? (
        <p className="text-xs text-neutral-400">No badges earned yet. Stay active across the Five C's!</p>
      ) : (
        <TooltipProvider>
          <div className="flex flex-wrap" style={{ gap: badgeLayout.spacing }}>
            {displayedBadges.map((badge) => {
              const Icon = MODULE_ICONS[badge.cModule] || Award;
              const color = MODULE_COLORS[badge.cModule] || '#6B7280';
              const recent = isRecent(badge.earnedAt);

              return (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`${badge.name} badge - view ${badge.cModule} activity`}
                      className={`
                        relative flex items-center justify-center rounded-full
                        border-2 transition-all duration-200 cursor-pointer hover:scale-110
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                        ${recent && badgeLayout.glowOnRecent ? 'animate-pulse' : ''}
                      `}
                      style={{
                        width: badgeLayout.size,
                        height: badgeLayout.size,
                        minWidth: 44,
                        minHeight: 44,
                        borderColor: color,
                        backgroundColor: `${color}15`,
                        boxShadow: recent ? `0 0 12px ${color}40` : undefined,
                      }}
                      onClick={(e) => {
                        if (isOwner && onToggleDisplay && e.shiftKey) {
                          onToggleDisplay(badge.id, !badge.isDisplayed);
                          return;
                        }
                        navigate(MODULE_ROUTES[badge.cModule] ?? '/dna/feed');
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px]">
                    <p className="font-semibold text-xs">{badge.name}</p>
                    <p className="text-[10px] text-neutral-500">{badge.description}</p>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Earned {new Date(badge.earnedAt).toLocaleDateString()}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      )}

      {/* Show remaining count if there are hidden badges */}
      {badges.filter((b) => b.isDisplayed).length > maxDisplayed && (
        <p className="text-[10px] text-neutral-400 mt-2">
          +{badges.filter((b) => b.isDisplayed).length - maxDisplayed} more badges
          {tier === 'free' && ' (upgrade to Pro to show more)'}
        </p>
      )}

      {/* Owner: show all badges for management */}
      {isOwner && badges.filter((b) => !b.isDisplayed).length > 0 && (
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <p className="text-[10px] text-neutral-400 mb-2">
            Hidden badges (click to display):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {badges
              .filter((b) => !b.isDisplayed)
              .map((badge) => {
                const Icon = MODULE_ICONS[badge.cModule] || Award;
                return (
                  <button
                    key={badge.id}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-neutral-400 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-colors"
                    onClick={() => onToggleDisplay?.(badge.id, true)}
                  >
                    <Icon className="w-3 h-3" />
                    {badge.name}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileBadges;
