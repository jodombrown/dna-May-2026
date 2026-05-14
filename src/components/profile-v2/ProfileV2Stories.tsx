import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, PenSquare, Plus, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProfileV2Data, ProfileV2Visibility } from '@/types/profileV2';
import { formatDistanceToNow } from 'date-fns';

interface ProfileV2StoriesProps {
  profile: ProfileV2Data;
  visibility: ProfileV2Visibility;
  isOwner: boolean;
}

interface StoryDisplayItem {
  id: string;
  type: 'story' | 'update' | 'impact' | 'highlight';
  title: string;
  subtitle: string | null;
  body: string | null;
  published_at: string | null;
  slug: string;
  status: string;
  space?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// Type color mapping
const getTypeColor = (type: string): string => {
  switch (type) {
    case 'story':
      return 'bg-copper-100 text-copper-800 dark:bg-copper-900 dark:text-copper-200';
    case 'update':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'impact':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'highlight':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    default:
      return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200';
  }
};

// Type icon mapping
const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'story':
      return '📖';
    case 'update':
      return '📢';
    case 'impact':
      return '✨';
    case 'highlight':
      return '🏆';
    default:
      return '📝';
  }
};

const ProfileV2Stories: React.FC<ProfileV2StoriesProps> = ({
  profile,
  visibility,
  isOwner,
}) => {
  const navigate = useNavigate();
  const profileUserId = profile.id;

  // Query stories authored by the profile user from posts table
  // Note: posts table has no FK to spaces, so we fetch separately
  const { data: stories = [], isLoading: storiesLoading } = useQuery({
    queryKey: ['profile-stories', profileUserId, isOwner],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          post_type,
          story_type,
          title,
          subtitle,
          content,
          created_at,
          slug,
          space_id
        `)
        .eq('author_id', profileUserId)
        .eq('post_type', 'story')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false, nullsFirst: false });

      if (error) {
        throw error;
      }

      // Fetch space names separately (no FK constraint)
      const spaceIds = [...new Set((data || []).map(d => d.space_id).filter(Boolean))];
      let spaceMap = new Map<string, { id: string; name: string; slug: string }>();
      if (spaceIds.length > 0) {
        const { data: spaces } = await supabase
          .from('spaces')
          .select('id, name, slug')
          .in('id', spaceIds);
        spaces?.forEach(s => spaceMap.set(s.id, { id: s.id, name: s.name, slug: s.slug || s.id }));
      }

      return (data || []).map((item: any): StoryDisplayItem => ({
        id: item.id,
        type: item.story_type || 'story',
        title: item.title || 'Untitled',
        subtitle: item.subtitle,
        body: item.content,
        published_at: item.created_at,
        slug: item.slug || item.id,
        status: 'published',
        space: item.space_id ? spaceMap.get(item.space_id) || null : null,
      }));
    },
    enabled: !!profileUserId,
  });

  // Query impact stories/highlights - currently empty since posts table doesn't have impact type
  // This maintains the UI structure for future implementation
  const { data: highlights = [], isLoading: highlightsLoading } = useQuery({
    queryKey: ['profile-highlights', profileUserId, isOwner],
    queryFn: async () => {
      // Posts table currently only has 'story' post_type for stories
      // Return empty array - impact highlights can be added when that feature is built
      return [] as StoryDisplayItem[];
    },
    enabled: !!profileUserId,
  });

  // Sort by published date, drafts at the end
  const sortItems = (items: StoryDisplayItem[]) => {
    return [...items].sort((a, b) => {
      // Published items first
      if (a.status === 'published' && b.status !== 'published') return -1;
      if (b.status === 'published' && a.status !== 'published') return 1;
      // Then by published date descending
      const aTime = a.published_at ? new Date(a.published_at).getTime() : 0;
      const bTime = b.published_at ? new Date(b.published_at).getTime() : 0;
      return bTime - aTime;
    });
  };

  const sortedStories = sortItems(stories);
  const sortedHighlights = sortItems(highlights);

  const totalStories = stories.length;
  const totalHighlights = highlights.length;
  const totalItems = totalStories + totalHighlights;

  const isLoading = storiesLoading || highlightsLoading;
  const hasItems = totalItems > 0;

  // Hide if visibility is set to hidden and viewer is not owner
  if (visibility.stories === 'hidden' && !isOwner) {
    return null;
  }

  // Hide if no items and not the owner
  if (!hasItems && !isOwner && !isLoading) {
    return null;
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Stories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get excerpt from body text
  const getExcerpt = (body: string | null, maxLength: number = 150): string => {
    if (!body) return '';
    const text = body.replace(/<[^>]*>/g, '').replace(/[#*`]/g, '').trim();
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const StoryCard = ({ story }: { story: StoryDisplayItem }) => (
    <Link to={`/dna/story/${story.slug}`}>
      <Card className="hover:shadow-lg hover:border-primary/20 transition-all h-full">
        <CardContent className="pt-6 space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-lg line-clamp-2">{story.title}</h3>
              <Badge className={`text-xs shrink-0 capitalize ${getTypeColor(story.type)}`}>
                {getTypeIcon(story.type)} {story.type}
              </Badge>
            </div>
            {story.subtitle && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-1">{story.subtitle}</p>
            )}
            {story.body && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {getExcerpt(story.body)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {story.status !== 'published' && isOwner && (
              <Badge variant="secondary" className="text-xs">
                {story.status === 'draft' ? 'Draft' : story.status}
              </Badge>
            )}
            {story.space && (
              <Badge variant="outline" className="text-xs">
                📂 {story.space.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            {story.published_at && (
              <span>Published {formatDistanceToNow(new Date(story.published_at), { addSuffix: true })}</span>
            )}
            {!story.published_at && story.status === 'draft' && (
              <span className="italic">Unpublished draft</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const renderStoriesList = (
    items: StoryDisplayItem[],
    emptyIcon: React.ReactNode,
    emptyTitle: string,
    emptyDescription: string,
    emptyAction: { label: string; path: string }
  ) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            {emptyIcon}
          </div>
          <p className="text-lg font-medium text-foreground mb-2">{emptyTitle}</p>
          <p className="text-sm text-muted-foreground mb-4">
            {emptyDescription}
          </p>
          {isOwner && (
            <Button onClick={() => navigate(emptyAction.path)}>
              {emptyAction.label}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {items.map((item) => (
          <StoryCard key={item.id} story={item} />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Stories
            <Badge variant="secondary" className="ml-2">
              {totalItems}
            </Badge>
          </div>
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dna/convey/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Write Story
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <PenSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-primary">{totalStories}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Stories & Updates</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-primary">{totalHighlights}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Impact Highlights</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="stories" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stories" className="flex items-center gap-2">
              <span>Stories & Updates</span>
              <Badge variant="outline" className="text-xs">
                {totalStories}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="highlights" className="flex items-center gap-2">
              <span>Impact Highlights</span>
              <Badge variant="outline" className="text-xs">
                {totalHighlights}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stories" className="mt-4">
            {renderStoriesList(
              sortedStories,
              <PenSquare className="w-8 h-8 text-primary" />,
              'No stories yet',
              isOwner
                ? 'Share your experiences and journey with the community!'
                : `${profile.full_name || 'This user'} hasn't published any stories yet.`,
              { label: 'Write Story', path: '/dna/convey/new' }
            )}
          </TabsContent>

          <TabsContent value="highlights" className="mt-4">
            {renderStoriesList(
              sortedHighlights,
              <Award className="w-8 h-8 text-primary" />,
              'No impact highlights yet',
              isOwner
                ? 'Share your impact stories and achievements!'
                : `${profile.full_name || 'This user'} hasn't shared any impact highlights yet.`,
              { label: 'Share Impact', path: '/dna/convey/new' }
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProfileV2Stories;
