import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, Eye, MousePointerClick, FileText } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Link } from 'react-router-dom';

type DateRange = '7' | '30' | '90';

export default function ConveyAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>('30');

  const startDate = subDays(new Date(), parseInt(dateRange)).toISOString();

  // Summary metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['convey-metrics', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_name, created_at')
        .gte('created_at', startDate)
        .like('event_name', 'convey_%');

      if (error) throw error;

      const created = data?.filter(e => e.event_name === 'convey_item_created').length || 0;
      const published = data?.filter(e => e.event_name === 'convey_item_published').length || 0;
      const viewed = data?.filter(e => e.event_name === 'convey_item_viewed').length || 0;
      const ctaClicked = data?.filter(e => e.event_name === 'convey_item_cta_clicked').length || 0;

      return { created, published, viewed, ctaClicked };
    },
  });

  // Top stories by views
  const { data: topStories, isLoading: storiesLoading } = useQuery({
    queryKey: ['convey-top-stories', dateRange],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('event_metadata')
        .eq('event_name', 'convey_item_viewed')
        .gte('created_at', startDate);

      if (error) throw error;

      // Aggregate by convey_item_id
      const viewCounts: Record<string, number> = {};
      events?.forEach(e => {
        const metadata = e.event_metadata as any;
        const itemId = metadata?.convey_item_id;
        if (itemId) {
          viewCounts[itemId] = (viewCounts[itemId] || 0) + 1;
        }
      });

      // Get CTA clicks
      const { data: ctaEvents } = await supabase
        .from('analytics_events')
        .select('event_metadata')
        .eq('event_name', 'convey_item_cta_clicked')
        .gte('created_at', startDate);

      const ctaCounts: Record<string, number> = {};
      ctaEvents?.forEach(e => {
        const metadata = e.event_metadata as any;
        const itemId = metadata?.convey_item_id;
        if (itemId) {
          ctaCounts[itemId] = (ctaCounts[itemId] || 0) + 1;
        }
      });

      // Fetch top items
      const topItemIds = Object.entries(viewCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id]) => id);

      if (topItemIds.length === 0) return [];

      const { data: items } = await supabase
        .from('posts')
        .select(`
          id,
          slug,
          title,
          post_type,
          created_at,
          primary_space:spaces!posts_space_id_fkey(id, name, slug)
        `)
        .in('post_type', ['story', 'update', 'impact'])
        .in('id', topItemIds);

      return items?.map((item: any) => ({
        ...item,
        type: item.post_type, // Map post_type to type for template compatibility
        published_at: item.created_at, // Map created_at to published_at
        views: viewCounts[item.id] || 0,
        ctaClicks: ctaCounts[item.id] || 0,
      })).sort((a: any, b: any) => b.views - a.views) || [];
    },
  });

  // Space activity
  const { data: spaceActivity, isLoading: spaceLoading } = useQuery({
    queryKey: ['convey-space-activity', dateRange],
    queryFn: async () => {
      const { data: items } = await supabase
        .from('posts')
        .select(`
          id,
          space_id,
          primary_space:spaces!posts_space_id_fkey(id, name, slug)
        `)
        .in('post_type', ['story', 'update', 'impact'])
        .eq('is_deleted', false)
        .not('space_id', 'is', null);

      if (!items) return [];

      // Get view counts for each item
      const { data: events } = await supabase
        .from('analytics_events')
        .select('event_metadata')
        .eq('event_name', 'convey_item_viewed')
        .gte('created_at', startDate);

      const viewsByItem: Record<string, number> = {};
      events?.forEach(e => {
        const metadata = e.event_metadata as any;
        const itemId = metadata?.convey_item_id;
        if (itemId) viewsByItem[itemId] = (viewsByItem[itemId] || 0) + 1;
      });

      // Get CTA clicks
      const { data: ctaEvents } = await supabase
        .from('analytics_events')
        .select('event_metadata')
        .eq('event_name', 'convey_item_cta_clicked')
        .gte('created_at', startDate);

      const ctasByItem: Record<string, number> = {};
      ctaEvents?.forEach(e => {
        const metadata = e.event_metadata as any;
        const itemId = metadata?.convey_item_id;
        if (itemId) ctasByItem[itemId] = (ctasByItem[itemId] || 0) + 1;
      });

      // Aggregate by space
      const spaceMap: Record<string, { 
        space: any; 
        itemCount: number; 
        totalViews: number; 
        totalCtas: number;
      }> = {};

      items?.forEach((item: any) => {
        const spaceId = item.space_id;
        if (!spaceId || !item.primary_space) return;

        if (!spaceMap[spaceId]) {
          spaceMap[spaceId] = {
            space: item.primary_space,
            itemCount: 0,
            totalViews: 0,
            totalCtas: 0,
          };
        }

        spaceMap[spaceId].itemCount++;
        spaceMap[spaceId].totalViews += viewsByItem[item.id] || 0;
        spaceMap[spaceId].totalCtas += ctasByItem[item.id] || 0;
      });

      return Object.values(spaceMap)
        .sort((a, b) => b.totalViews - a.totalViews)
        .slice(0, 10);
    },
  });

  const isLoading = metricsLoading || storiesLoading || spaceLoading;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-h1 font-serif text-foreground mb-2">
          CONVEY Analytics
        </h1>
        <p className="text-muted-foreground">
          Track story creation, engagement, and impact across the platform
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 flex justify-end">
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stories Created</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-h2 font-serif">{metrics?.created || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stories Published</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-h2 font-serif">{metrics?.published || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-h2 font-serif">{metrics?.viewed || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CTA Clicks</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-h2 font-serif">{metrics?.ctaClicked || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Top Stories */}
          <Card>
            <CardHeader>
              <CardTitle>Top Stories by Views</CardTitle>
              <CardDescription>Most viewed stories in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {topStories && topStories.length > 0 ? (
                <div className="space-y-4">
                  {topStories.map((story: any) => (
                    <div key={story.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/dna/story/${story.slug}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {story.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="capitalize">{story.type}</span>
                          {story.primary_space && (
                            <>
                              <span>•</span>
                              <Link 
                                to={`/dna/collaborate/spaces/${story.primary_space.slug}`}
                                className="hover:text-primary transition-colors"
                              >
                                {story.primary_space.name}
                              </Link>
                            </>
                          )}
                          {story.published_at && (
                            <>
                              <span>•</span>
                              <span>{format(new Date(story.published_at), 'MMM d, yyyy')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4 ml-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-foreground">{story.views}</div>
                          <div className="text-xs text-muted-foreground">views</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-foreground">{story.ctaClicks}</div>
                          <div className="text-xs text-muted-foreground">clicks</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No story views in this period
                </p>
              )}
            </CardContent>
          </Card>

          {/* Space Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Spaces with Most CONVEY Activity</CardTitle>
              <CardDescription>Spaces creating and engaging with stories</CardDescription>
            </CardHeader>
            <CardContent>
              {spaceActivity && spaceActivity.length > 0 ? (
                <div className="space-y-4">
                  {spaceActivity.map((activity: any) => (
                    <div key={activity.space.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <Link 
                          to={`/dna/collaborate/spaces/${activity.space.slug}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {activity.space.name}
                        </Link>
                        <div className="text-sm text-muted-foreground mt-1">
                          {activity.itemCount} {activity.itemCount === 1 ? 'story' : 'stories'}
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-foreground">{activity.totalViews}</div>
                          <div className="text-xs text-muted-foreground">views</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-foreground">{activity.totalCtas}</div>
                          <div className="text-xs text-muted-foreground">clicks</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No space activity in this period
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
