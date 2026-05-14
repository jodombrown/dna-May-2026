import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CulturalPattern } from '@/components/shared/CulturalPattern';
import { UserPlus, Users, TrendingUp, Calendar, Lightbulb, ChevronRight, X, Eye, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sankofa } from '@/components/icons/adinkra';

/**
 * DIA Insight Card Types (from PRD)
 *
 * 1. NewArrivals - "3 new members in your sector joined this week"
 * 2. PeopleYouShouldKnow - "Kimberly Nelson is working on workforce development..."
 * 3. NetworkInsight - "Your connections are 40% more active in COLLABORATE..."
 * 4. EventOverlap - "12 people you've messaged are attending Lagos Summit 2026"
 * 5. ContributionMatch - "Paul Nelson posted a need that matches your expertise..."
 */

export type DiaInsightType =
  | 'new_arrivals'
  | 'people_you_should_know'
  | 'network_insight'
  | 'event_overlap'
  | 'contribution_match';

export interface DiaInsightData {
  id: string;
  type: DiaInsightType;
  title?: string;
  description: string;
  primaryAction: {
    label: string;
    action: () => void;
  };
  secondaryAction?: {
    label: string;
    action: () => void;
  };
  // Type-specific data
  members?: {
    id: string;
    name: string;
    avatar_url?: string;
    headline?: string;
  }[];
  count?: number;
  percentage?: number;
  event?: {
    id: string;
    title: string;
    date: string;
  };
  opportunity?: {
    id: string;
    title: string;
    type: 'need' | 'offer';
    author: string;
  };
}

interface DiaInsightCardProps {
  insight: DiaInsightData;
  onDismiss?: (id: string) => void;
  onConnect?: (memberId: string, memberName: string, headline?: string) => void;
  className?: string;
}

/**
 * DiaInsightCard - Inline DIA intelligence cards for discovery feed
 *
 * PRD Requirements:
 * - Cards appear naturally within the discovery feed (not separate panel)
 * - Provide proactive intelligence without requiring user queries
 * - Insert one DIA card after every 4-6 member cards
 * - Never show more than 3 DIA cards visible simultaneously
 * - Dismissed cards don't reappear for 7 days
 */
export function DiaInsightCard({
  insight,
  onDismiss,
  onConnect,
  className,
}: DiaInsightCardProps) {
  const navigate = useNavigate();

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.(insight.id);
  };

  // Render based on insight type
  const renderContent = () => {
    switch (insight.type) {
      case 'new_arrivals':
        return <NewArrivalsContent insight={insight} navigate={navigate} />;
      case 'people_you_should_know':
        return <PeopleYouShouldKnowContent insight={insight} navigate={navigate} onConnect={onConnect} />;
      case 'network_insight':
        return <NetworkInsightContent insight={insight} navigate={navigate} />;
      case 'event_overlap':
        return <EventOverlapContent insight={insight} navigate={navigate} />;
      case 'contribution_match':
        return <ContributionMatchContent insight={insight} navigate={navigate} />;
      default:
        return null;
    }
  };

  const getGradient = () => {
    switch (insight.type) {
      case 'new_arrivals':
        return 'from-dna-emerald/5 to-dna-mint/10';
      case 'people_you_should_know':
        return 'from-dna-terra/5 to-dna-ochre/10';
      case 'network_insight':
        return 'from-dna-purple/5 to-dna-sunset/10';
      case 'event_overlap':
        return 'from-dna-sunset/5 to-dna-crimson/10';
      case 'contribution_match':
        return 'from-dna-ochre/5 to-dna-copper/10';
      default:
        return 'from-primary/5 to-primary/10';
    }
  };

  const getBorderColor = () => {
    switch (insight.type) {
      case 'new_arrivals':
        return 'border-dna-emerald/20';
      case 'people_you_should_know':
        return 'border-dna-terra/20';
      case 'network_insight':
        return 'border-dna-purple/20';
      case 'event_overlap':
        return 'border-dna-sunset/20';
      case 'contribution_match':
        return 'border-dna-ochre/20';
      default:
        return 'border-primary/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={className}
    >
      <Card
        className={cn(
          'relative overflow-hidden bg-gradient-to-br border',
          getGradient(),
          getBorderColor()
        )}
      >
        {/* Adinkra cultural pattern — wisdom aligns with DIA intelligence */}
        <CulturalPattern pattern="adinkra" opacity={0.06} />

        {/* DIA Badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className="bg-white/80 backdrop-blur-sm text-xs font-medium flex items-center gap-1"
          >
            <Sankofa className="h-3 w-3 text-primary" />
            DIA Insight
          </Badge>
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-black/5 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        <CardContent className="pt-10 pb-4 px-4">{renderContent()}</CardContent>
      </Card>
    </motion.div>
  );
}

// Individual content components for each insight type

function NewArrivalsContent({
  insight,
  navigate,
}: {
  insight: DiaInsightData;
  navigate: (path: string) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Stacked avatars */}
      {insight.members && insight.members.length > 0 && (
        <div className="flex -space-x-2">
          {insight.members.slice(0, 3).map((member, index) => (
            <Avatar
              key={member.id}
              className="h-10 w-10 border-2 border-background"
              style={{ zIndex: 3 - index }}
            >
              <AvatarImage src={member.avatar_url} alt={member.name} />
              <AvatarFallback className="bg-dna-emerald/20 text-dna-forest text-sm">
                {member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
          ))}
          {insight.count && insight.count > 3 && (
            <div className="h-10 w-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
              +{insight.count - 3}
            </div>
          )}
        </div>
      )}

      <div>
        <p className="font-medium text-foreground">{insight.description}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Want to meet them?
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="bg-dna-emerald hover:bg-dna-emerald/90 text-white"
          onClick={insight.primaryAction.action}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          {insight.primaryAction.label}
        </Button>
        {insight.secondaryAction && (
          <Button
            size="sm"
            variant="ghost"
            onClick={insight.secondaryAction.action}
          >
            {insight.secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

function PeopleYouShouldKnowContent({
  insight,
  navigate,
  onConnect,
}: {
  insight: DiaInsightData;
  navigate: (path: string) => void;
  onConnect?: (memberId: string, memberName: string, headline?: string) => void;
}) {
  const member = insight.members?.[0];

  const handleConnect = () => {
    if (member && onConnect) {
      onConnect(member.id, member.name, member.headline);
    } else if (insight.primaryAction?.action) {
      insight.primaryAction.action();
    }
  };

  return (
    <div className="space-y-3">
      {member && (
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border-2 border-dna-terra/20">
            <AvatarImage src={member.avatar_url} alt={member.name} />
            <AvatarFallback className="bg-dna-terra/20 text-dna-terra">
              {member.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">{member.name}</p>
            {member.headline && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {member.headline}
              </p>
            )}
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground">{insight.description}</p>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="bg-dna-terra hover:bg-dna-terra/90 text-white"
          onClick={handleConnect}
        >
          <UserPlus className="h-3.5 w-3.5 mr-1" />
          {insight.primaryAction?.label || 'Connect'}
        </Button>
        {insight.secondaryAction && (
          <Button
            size="sm"
            variant="ghost"
            onClick={insight.secondaryAction.action}
          >
            {insight.secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

function NetworkInsightContent({
  insight,
  navigate,
}: {
  insight: DiaInsightData;
  navigate: (path: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-dna-purple/10">
          <TrendingUp className="h-5 w-5 text-dna-purple" />
        </div>
        <div>
          {insight.percentage !== undefined && (
            <p className="text-2xl font-bold text-dna-purple">
              +{insight.percentage}%
            </p>
          )}
          <p className="text-sm text-muted-foreground">Network activity</p>
        </div>
      </div>

      <p className="font-medium text-foreground">{insight.description}</p>

      <Button
        size="sm"
        variant="outline"
        className="border-dna-purple/30 text-dna-purple hover:bg-dna-purple/10"
        onClick={insight.primaryAction.action}
      >
        {insight.primaryAction.label}
        <ArrowRight className="h-3.5 w-3.5 ml-1" />
      </Button>
    </div>
  );
}

function EventOverlapContent({
  insight,
  navigate,
}: {
  insight: DiaInsightData;
  navigate: (path: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-dna-sunset/10">
          <Calendar className="h-5 w-5 text-dna-sunset" />
        </div>
        <div>
          {insight.event && (
            <p className="font-medium text-foreground">{insight.event.title}</p>
          )}
          {insight.count && (
            <p className="text-sm text-muted-foreground">
              {insight.count} people you know
            </p>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{insight.description}</p>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="bg-dna-sunset hover:bg-dna-sunset/90 text-white"
          onClick={insight.primaryAction.action}
        >
          <Users className="h-3.5 w-3.5 mr-1" />
          {insight.primaryAction.label}
        </Button>
        {insight.secondaryAction && (
          <Button
            size="sm"
            variant="ghost"
            onClick={insight.secondaryAction.action}
          >
            {insight.secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

function ContributionMatchContent({
  insight,
  navigate,
}: {
  insight: DiaInsightData;
  navigate: (path: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-dna-ochre/10">
          <Lightbulb className="h-5 w-5 text-dna-ochre" />
        </div>
        <div>
          {insight.opportunity && (
            <>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] mb-1',
                  insight.opportunity.type === 'need'
                    ? 'border-rose-200 text-rose-600'
                    : 'border-emerald-200 text-emerald-600'
                )}
              >
                {insight.opportunity.type === 'need' ? 'NEED' : 'OFFER'}
              </Badge>
              <p className="font-medium text-foreground line-clamp-1">
                {insight.opportunity.title}
              </p>
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{insight.description}</p>

      <Button
        size="sm"
        variant="outline"
        className="border-dna-ochre/30 text-dna-ochre hover:bg-dna-ochre/10"
        onClick={insight.primaryAction.action}
      >
        {insight.primaryAction.label}
        <ChevronRight className="h-3.5 w-3.5 ml-1" />
      </Button>
    </div>
  );
}

export default DiaInsightCard;
