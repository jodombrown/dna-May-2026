/**
 * Profile Completion Checklist — DIA-powered completion nudges.
 *
 * Shows a progress bar and checklist of profile sections to complete.
 * Each incomplete item includes a DIA-generated encouragement message
 * explaining the value of completing that section.
 * Per PRD Section 3.1: Weights total 100, tracked per ProfileSection.
 */

import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { CompletionChecklistItem, UserTier } from '@/types/profileIdentityHub';
import { PROFILE_LAYOUT, PROFILE_TIER_GATES } from '@/types/profileIdentityHub';
import { Sankofa } from '@/components/icons/adinkra';

interface ProfileCompletionChecklistProps {
  completionPercentage: number;
  checklist: CompletionChecklistItem[];
  tier: UserTier;
  onNavigateToSection?: (section: string) => void;
}

export const ProfileCompletionChecklist: React.FC<ProfileCompletionChecklistProps> = ({
  completionPercentage,
  checklist,
  tier,
  onNavigateToSection,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDiaPowered = PROFILE_TIER_GATES[tier].completionNudges === 'dia_powered';

  const incompleteItems = checklist.filter((item) => !item.isComplete);
  const completedItems = checklist.filter((item) => item.isComplete);

  // Color based on completion level
  const progressColor =
    completionPercentage >= 80 ? '#4A8D77' :
    completionPercentage >= 50 ? '#C4942A' :
    '#B87333';

  const completionLabel =
    completionPercentage >= 80 ? 'Almost there!' :
    completionPercentage >= 50 ? 'Making great progress' :
    completionPercentage >= 25 ? 'Getting started' :
    'Let\'s build your profile';

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: PROFILE_LAYOUT.section.backgroundColor,
        boxShadow: `0 1px 3px ${PROFILE_LAYOUT.section.shadowColor}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3
            className="text-sm font-semibold"
            style={{ color: PROFILE_LAYOUT.section.titleColor }}
          >
            Profile Strength
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">{completionLabel}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold" style={{ color: progressColor }}>
            {completionPercentage}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <Progress
        value={completionPercentage}
        className="h-2 mb-4"
        style={{ '--progress-color': progressColor } as React.CSSProperties}
      />

      {/* Next actions (always show top 3 incomplete) */}
      {incompleteItems.length > 0 && (
        <div className="space-y-2 mb-3">
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
            Next steps
          </p>
          {incompleteItems.slice(0, 3).map((item) => (
            <button
              key={item.id}
              className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-neutral-50 transition-colors text-left group"
              onClick={() => onNavigateToSection?.(item.section)}
            >
              <div className="w-5 h-5 rounded-full border-2 border-neutral-200 flex-shrink-0 mt-0.5 group-hover:border-[#4A8D77] transition-colors" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">
                  {item.label}
                </p>
                {isDiaPowered && item.diaMessage && (
                  <p className="text-xs text-neutral-400 mt-0.5 flex items-start gap-1">
                    <Sankofa className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-400" />
                    <span>{item.diaMessage}</span>
                  </p>
                )}
                <p className="text-[10px] text-neutral-300 mt-0.5">
                  +{item.weight} points
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Expand/collapse for full list */}
      {(incompleteItems.length > 3 || completedItems.length > 0) && (
        <button
          className="w-full flex items-center justify-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 transition-colors py-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              View all ({completedItems.length} done, {incompleteItems.length} remaining)
            </>
          )}
        </button>
      )}

      {/* Expanded view */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1.5">
          {/* Completed items */}
          {completedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 p-1.5 text-sm text-neutral-400"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
              <span className="line-through">{item.label}</span>
              <span className="text-[10px] ml-auto">+{item.weight}</span>
            </div>
          ))}

          {/* Remaining incomplete items (beyond the first 3) */}
          {incompleteItems.slice(3).map((item) => (
            <button
              key={item.id}
              className="w-full flex items-center gap-2.5 p-1.5 text-sm text-neutral-500 hover:bg-neutral-50 rounded transition-colors text-left"
              onClick={() => onNavigateToSection?.(item.section)}
            >
              <div className="w-5 h-5 rounded-full border-2 border-neutral-200 flex-shrink-0" />
              <span>{item.label}</span>
              <span className="text-[10px] text-neutral-300 ml-auto">+{item.weight}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tier nudge for free users */}
      {tier === 'free' && !isDiaPowered && (
        <div className="mt-3 p-2 bg-amber-50 rounded-lg text-center">
          <p className="text-[10px] text-amber-700">
            <Sankofa className="w-3 h-3 inline mr-1" />
            Upgrade to Pro for DIA-powered profile optimization tips
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionChecklist;
