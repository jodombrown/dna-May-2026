import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bug, Lightbulb, HelpCircle, Heart, Loader2, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  alphaFeedbackService,
  type FeedbackCategory,
  type FeedbackArea,
  type AlphaFeedbackRow,
} from '@/services/alphaFeedbackService';

const CATEGORY_CONFIG: Record<FeedbackCategory, { label: string; icon: React.ReactNode; color: string }> = {
  bug: {
    label: 'Bugs',
    icon: <Bug className="h-4 w-4" />,
    color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400',
  },
  feature_idea: {
    label: 'Ideas',
    icon: <Lightbulb className="h-4 w-4" />,
    color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400',
  },
  confusion: {
    label: 'Confusion',
    icon: <HelpCircle className="h-4 w-4" />,
    color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400',
  },
  love: {
    label: 'Love',
    icon: <Heart className="h-4 w-4" />,
    color: 'text-copper-600 bg-copper-50 border-copper-200 dark:bg-copper-950/30 dark:border-copper-800 dark:text-copper-400',
  },
};

const ALL_AREAS: FeedbackArea[] = [
  'feed', 'composer', 'events', 'spaces', 'marketplace', 'messages', 'dia', 'navigation', 'other',
];

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AlphaFeedbackDashboard() {
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | 'all'>('all');
  const [areaFilter, setAreaFilter] = useState<FeedbackArea | 'all'>('all');

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ['alpha-feedback'],
    queryFn: () => alphaFeedbackService.getFeedbackForAdmin(),
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['alpha-feedback-stats'],
    queryFn: () => alphaFeedbackService.getFeedbackStats(),
    refetchInterval: 30000,
  });

  const filteredFeedback = useMemo(() => {
    return feedback.filter((item: AlphaFeedbackRow) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (areaFilter !== 'all' && item.area !== areaFilter) return false;
      return true;
    });
  }, [feedback, categoryFilter, areaFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-emerald-600" />
        <h1 className="text-2xl font-bold text-foreground">Alpha Feedback Dashboard</h1>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-3">
          <p className="text-2xl font-bold text-foreground">{stats?.total ?? 0}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        {(Object.entries(CATEGORY_CONFIG) as Array<[FeedbackCategory, typeof CATEGORY_CONFIG[FeedbackCategory]]>).map(
          ([key, config]) => (
            <div
              key={key}
              className={cn(
                'rounded-xl border px-4 py-3',
                config.color
              )}
            >
              <div className="flex items-center gap-2">
                {config.icon}
                <p className="text-2xl font-bold">{stats?.byCategory[key] ?? 0}</p>
              </div>
              <p className="text-xs opacity-75">{config.label}</p>
            </div>
          )
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">Category:</span>
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              categoryFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
            )}
          >
            All
          </button>
          {(Object.keys(CATEGORY_CONFIG) as FeedbackCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                categoryFilter === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
              )}
            >
              {CATEGORY_CONFIG[cat].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">Area:</span>
          <button
            onClick={() => setAreaFilter('all')}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              areaFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
            )}
          >
            All
          </button>
          {ALL_AREAS.map((area) => (
            <button
              key={area}
              onClick={() => setAreaFilter(area)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors',
                areaFilter === area
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
              )}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-3">
        {filteredFeedback.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {feedback.length === 0
              ? 'No feedback submitted yet.'
              : 'No feedback matches the current filters.'}
          </div>
        ) : (
          filteredFeedback.map((item: AlphaFeedbackRow) => {
            const catConfig = CATEGORY_CONFIG[item.category];
            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-xl border px-5 py-4',
                  catConfig.color
                )}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold">
                    {catConfig.icon}
                    {catConfig.label}
                  </span>
                  {item.area && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/50 dark:bg-black/20 capitalize">
                      {item.area}
                    </span>
                  )}
                  <span className="text-[10px] opacity-60 ml-auto">
                    {timeAgo(item.created_at)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-2">{item.content}</p>
                <div className="flex items-center gap-3 text-[10px] opacity-50">
                  {item.page_url && <span>Page: {item.page_url}</span>}
                  {item.device_type && item.viewport && (
                    <span>
                      {item.device_type === 'mobile' ? 'Mobile' : 'Desktop'} ({item.viewport})
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
