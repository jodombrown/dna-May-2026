import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Hash, TrendingUp, ArrowLeft, Share2, Settings, Crown, Copy } from 'lucide-react';
import { useHashtag } from '@/hooks/useHashtag';
import { useTrendingHashtags } from '@/hooks/useTrendingHashtags';
import { UniversalFeedInfinite } from '@/components/feed/UniversalFeedInfinite';
import { useAuth } from '@/contexts/AuthContext';
import { HashtagStatsGrid } from '@/components/hashtag/HashtagStatsGrid';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function HashtagFeed() {
  const { hashtag: hashtagParam } = useParams<{ hashtag: string }>();
  const { user } = useAuth();
  const [sortMode, setSortMode] = useState<'latest' | 'top'>('latest');

  const {
    hashtag,
    posts,
    isLoading,
    isFollowing,
    toggleFollow,
    isTogglingFollow
  } = useHashtag(hashtagParam);

  const { data: trendingHashtags } = useTrendingHashtags(10);

  if (!hashtagParam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No hashtag specified</p>
      </div>
    );
  }

  if (isLoading) {
    return <HashtagPageSkeleton />;
  }

  // If hashtag doesn't exist yet in database but has been used
  const displayName = hashtag?.display_name || hashtagParam;

  return (
    <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link to="/dna/feed">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Feed
        </Link>
      </Button>

      {/* Header Card - Compact */}
      <Card className="border-l-4 border-l-dna-copper">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-dna-copper/10 flex items-center justify-center flex-shrink-0">
                <Hash className="h-5 w-5 sm:h-6 sm:w-6 text-dna-copper" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-1.5 flex-wrap">
                  <span className="truncate">#{displayName}</span>
                  {hashtag?.is_verified && (
                    <Badge variant="outline" className="text-blue-500 border-blue-500 text-xs px-1.5 py-0">
                      Verified
                    </Badge>
                  )}
                  {hashtag?.owner_id === user?.id && (
                    <Badge className="bg-dna-copper text-white text-xs px-1.5 py-0">
                      <Crown className="h-2.5 w-2.5 mr-0.5" />
                      Owner
                    </Badge>
                  )}
                </CardTitle>
                <Badge variant={hashtag?.type === 'personal' ? 'default' : 'secondary'} className="mt-1 text-xs px-2 py-0">
                  {hashtag?.type === 'personal' ? 'Personal' : 'Community'}
                </Badge>
              </div>
            </div>

            <div className="flex gap-1.5 flex-shrink-0">
              {user && hashtag?.owner_id === user.id && (
                <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3" asChild>
                  <Link to="/dna/settings/hashtags">
                    <Settings className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Manage</span>
                  </Link>
                </Button>
              )}
              {user && hashtag?.owner_id !== user.id && (
                <Button
                  variant={isFollowing ? 'outline' : 'default'}
                  size="sm"
                  className={`h-8 px-3 ${isFollowing ? '' : 'bg-dna-copper hover:bg-dna-copper/90'}`}
                  onClick={toggleFollow}
                  disabled={isTogglingFollow}
                >
                  {isTogglingFollow ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isFollowing ? (
                    'Following'
                  ) : (
                    'Follow'
                  )}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Share2 className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      const url = `${window.location.origin}/dna/hashtag/${displayName}`;
                      navigator.clipboard.writeText(url);
                      toast.success('Link copied to clipboard');
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy link
                  </DropdownMenuItem>
                  {typeof navigator.share === 'function' && (
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          await navigator.share({
                            title: `#${displayName} on DNA`,
                            text: `Check out #${displayName} on DNA - Diaspora Network of Africa`,
                            url: `${window.location.origin}/dna/hashtag/${displayName}`,
                          });
                        } catch (err) {
                          if ((err as Error).name !== 'AbortError') {
                            toast.error('Failed to share');
                          }
                        }
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Owner info (for personal hashtags, only show if not the current user) */}
          {hashtag?.type === 'personal' && hashtag?.owner_id && hashtag.owner_id !== user?.id && (
            <div className="flex items-center gap-2 mt-3 p-2 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Owned by</span>
              <Link
                to={`/dna/${hashtag.owner_username || hashtag.owner_id}`}
                className="flex items-center gap-1.5 hover:underline"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={hashtag.owner_avatar || undefined} />
                  <AvatarFallback className="text-xs">{hashtag.owner_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{hashtag.owner_name}</span>
                {hashtag.owner_username && (
                  <span className="text-muted-foreground text-xs">@{hashtag.owner_username}</span>
                )}
              </Link>
            </div>
          )}

          {/* Description */}
          {hashtag?.description && (
            <p className="text-muted-foreground text-sm mt-3">{hashtag.description}</p>
          )}

          {/* Stats - More compact */}
          <HashtagStatsGrid
            postCount={hashtag?.usage_count || posts?.length || 0}
            followerCount={hashtag?.follower_count || 0}
            createdAt={hashtag?.created_at}
          />
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sort Tabs */}
          <Tabs value={sortMode} onValueChange={(v) => setSortMode(v as 'latest' | 'top')}>
            <TabsList>
              <TabsTrigger value="latest">Recent</TabsTrigger>
              <TabsTrigger value="top">Top</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Posts - canonical pipeline so cards render identically to the main feed */}
          {user ? (
            <UniversalFeedInfinite
              viewerId={user.id}
              tab="all"
              hashtag={hashtagParam}
              rankingMode={sortMode}
              surface="home"
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">Sign in to view posts</p>
                <p className="text-sm text-muted-foreground">
                  Posts using #{displayName} appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Trending hashtags */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-dna-copper" />
                Trending Hashtags
              </CardTitle>
              <CardDescription>Popular topics this week</CardDescription>
            </CardHeader>
            <CardContent>
              {trendingHashtags && trendingHashtags.length > 0 ? (
                <div className="space-y-3">
                  {trendingHashtags.map((trending, index) => {
                    const trendingName = (trending as any).tag || (trending as any).name || (trending as any).hashtag;
                    const recentCount = (trending as any).recent_usage_count || (trending as any).recent_uses || (trending as any).recent_post_count || 0;

                    return (
                      <Link
                        key={trendingName}
                        to={`/dna/hashtag/${trendingName}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <div>
                              <p className="font-semibold text-sm">#{trendingName}</p>
                              <p className="text-xs text-muted-foreground">
                                {recentCount} post{recentCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          {trendingName?.toLowerCase() === hashtagParam?.toLowerCase() && (
                            <Badge className="bg-dna-copper text-white">
                              Current
                            </Badge>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No trending hashtags yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HashtagPageSkeleton() {
  return (
    <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      <Skeleton className="h-7 w-28" />
      <Card className="border-l-4 border-l-dna-copper">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex items-start gap-2.5">
            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex-shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          {/* Stats skeleton */}
          <div className="grid grid-cols-3 gap-2 p-2.5 sm:p-3 bg-muted/50 rounded-lg mt-3">
            <div className="text-center space-y-1">
              <Skeleton className="h-5 w-10 mx-auto" />
              <Skeleton className="h-3 w-8 mx-auto" />
            </div>
            <div className="text-center space-y-1">
              <Skeleton className="h-5 w-10 mx-auto" />
              <Skeleton className="h-3 w-14 mx-auto" />
            </div>
            <div className="text-center space-y-1">
              <Skeleton className="h-5 w-14 mx-auto" />
              <Skeleton className="h-3 w-10 mx-auto" />
            </div>
          </div>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="hidden lg:block">
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    </div>
  );
}
