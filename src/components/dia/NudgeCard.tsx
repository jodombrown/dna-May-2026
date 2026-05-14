import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Award, Bell, UserPlus, FileText, Target } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';

type Nudge = {
  id: string;
  nudge_type?: string;
  message?: string;
  payload?: {
    action_url?: string;
    match_score?: number;
    match_reasons?: string[];
    opportunity_title?: string;
    space_name?: string;
    [key: string]: any;
  };
  priority?: 'low' | 'normal' | 'high' | 'medium';
  [key: string]: any;
};

type Props = {
  nudge: Nudge;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, until: string) => void;
};

// Nudge type configurations
const NUDGE_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  // Opportunity nudges
  opportunity_match: {
    label: 'Opportunity Match',
    icon: Target,
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
  opportunity_trending: {
    label: 'Trending',
    icon: TrendingUp,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  contribution_impact: {
    label: 'Impact Update',
    icon: Award,
    color: 'bg-copper-100 text-copper-800 dark:bg-copper-900 dark:text-copper-200',
  },
  // Existing nudge types
  kickstart: {
    label: 'Getting Started',
    icon: MateMasie,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  first_connections: {
    label: 'Connect',
    icon: UserPlus,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  reengagement: {
    label: 'Welcome Back',
    icon: Bell,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  dormant_comeback: {
    label: 'We Miss You',
    icon: Bell,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  at_risk_post: {
    label: 'Share Update',
    icon: FileText,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  new_connections: {
    label: 'Connections',
    icon: Users,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  profile_incomplete: {
    label: 'Complete Profile',
    icon: MateMasie,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  popular_post: {
    label: 'Content',
    icon: TrendingUp,
    color: 'bg-copper-100 text-copper-800 dark:bg-copper-900 dark:text-copper-200',
  },
  weak_connection: {
    label: 'Reconnect',
    icon: Users,
    color: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200',
  },
};

// Priority colors
const PRIORITY_STYLES: Record<string, string> = {
  high: 'border-l-4 border-l-red-500',
  normal: 'border-l-4 border-l-blue-500',
  medium: 'border-l-4 border-l-blue-500',
  low: 'border-l-4 border-l-neutral-300',
};

export default function NudgeCard({ nudge, onAccept, onDismiss, onSnooze }: Props) {
  const navigate = useNavigate();

  const snooze30d = () => {
    const until = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    onSnooze(nudge.id, until);
  };

  const handleAccept = () => {
    // Navigate to action URL if available
    if (nudge.payload?.action_url) {
      navigate(nudge.payload.action_url);
    }
    onAccept(nudge.id);
  };

  const config = NUDGE_TYPE_CONFIG[nudge.nudge_type || ''] || {
    label: nudge.nudge_type || 'Notification',
    icon: Bell,
    color: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200',
  };

  const Icon = config.icon;
  const priorityStyle = PRIORITY_STYLES[nudge.priority || 'normal'] || PRIORITY_STYLES.normal;

  // Check if this is an opportunity-related nudge
  const isOpportunityNudge = ['opportunity_match', 'opportunity_trending', 'contribution_impact'].includes(
    nudge.nudge_type || ''
  );

  // Get action button text based on nudge type
  const getActionButtonText = () => {
    if (nudge.nudge_type === 'opportunity_match') return 'View Opportunity';
    if (nudge.nudge_type === 'opportunity_trending') return 'Check It Out';
    if (nudge.nudge_type === 'contribution_impact') return 'See Impact';
    if (nudge.nudge_type === 'new_connections') return 'View Requests';
    if (nudge.nudge_type === 'profile_incomplete') return 'Complete Profile';
    return 'Do this';
  };

  return (
    <div className={`border border-border rounded-xl p-4 shadow-sm bg-card ${priorityStyle}`}>
      {/* Header with type badge and match score */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${config.color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">{config.label}</span>
        </div>
        {isOpportunityNudge && nudge.payload?.match_score && (
          <Badge variant="secondary" className="text-xs">
            {nudge.payload.match_score}% match
          </Badge>
        )}
      </div>

      {/* Message */}
      <div className="mt-1 leading-relaxed text-foreground">{nudge.message}</div>

      {/* Match reasons for opportunity nudges */}
      {isOpportunityNudge && nudge.payload?.match_reasons && nudge.payload.match_reasons.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {nudge.payload.match_reasons.slice(0, 3).map((reason, idx) => (
            <Badge key={idx} variant="outline" className="text-xs font-normal">
              {reason}
            </Badge>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-3 flex gap-2 flex-wrap">
        <Button size="sm" onClick={handleAccept}>
          {getActionButtonText()}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDismiss(nudge.id)}>
          Not now
        </Button>
        <Button size="sm" variant="ghost" onClick={snooze30d}>
          Snooze
        </Button>
      </div>
    </div>
  );
}
