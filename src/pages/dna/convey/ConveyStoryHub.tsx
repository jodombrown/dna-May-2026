import { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LayoutController from '@/components/LayoutController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Heart, Lightbulb, PenSquare, Camera, Megaphone, Target, Flame, Star, Filter, Compass, Users, Mic, Bookmark } from 'lucide-react';
import { useUniversalComposer } from '@/hooks/useUniversalComposer';
import { UniversalComposer } from '@/components/composer/UniversalComposer';
import { Mpatapo } from '@/components/icons/adinkra';

import { useMobile } from '@/hooks/useMobile';
import { STORY_TYPE_CONFIG, type StoryType } from '@/types/storyTypes';
import { cn } from '@/lib/utils';
import { DnaMobileHeader } from '@/components/mobile/DnaMobileHeader';
import { useMobileHeaderHeight } from '@/hooks/useMobileHeaderHeight';
import { useInfiniteUniversalFeed } from '@/hooks/useInfiniteUniversalFeed';
import { ConveyTrendingSection } from '@/components/convey/ConveyTrendingSection';
import { ConveyEditorialCard } from '@/components/convey/ConveyEditorialCards';
import { ConveyCategorySection, ConveyMiniCard } from '@/components/convey/ConveyCategorySection';
import { DiaContextual } from '@/components/dia';

// ─── CONVEY Editorial Tabs ───────────────────────────────────────────
type ConveyTab = 'pulse' | 'curated' | 'my_circle' | 'my_voice' | 'saved';

interface TabConfig {
  id: ConveyTab;
  label: string;
  descriptor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CONVEY_TABS: TabConfig[] = [
  { id: 'pulse', label: 'Pulse', descriptor: 'Everything happening across the diaspora right now', icon: Flame },
  { id: 'curated', label: 'Curated', descriptor: "DIA's picks based on your interests and connections", icon: Compass },
  { id: 'my_circle', label: 'My Circle', descriptor: 'Dispatches from the people in your world', icon: Users },
  { id: 'my_voice', label: 'My Voice', descriptor: "Your contribution to the diaspora's story", icon: Mic },
  { id: 'saved', label: 'Saved', descriptor: "Posts you've bookmarked to read later or reference again", icon: Bookmark },
];

// Map editorial tabs to feed query params
function tabToFeedParams(tab: ConveyTab, userId?: string) {
  switch (tab) {
    case 'pulse': return { tab: 'all' as const };
    case 'curated': return { tab: 'for_you' as const };
    case 'my_circle': return { tab: 'network' as const };
    case 'my_voice': return { tab: 'my_posts' as const, authorId: userId };
    case 'saved': return { tab: 'bookmarks' as const };
  }
}

// Category pills for story type filtering
const categoryPills = [
  { id: 'all' as const, label: 'All', icon: Mpatapo },
  { id: 'impact' as StoryType, label: 'Impact', icon: Target },
  { id: 'update' as StoryType, label: 'Updates', icon: Megaphone },
  { id: 'spotlight' as StoryType, label: 'Spotlights', icon: Star },
  { id: 'photo_essay' as StoryType, label: 'Photos', icon: Camera },
];

// ─── Editorial Tab Bar Component ─────────────────────────────────────
// Mobile: segmented pill row (icon + active-label) matching the shared
// DNA hub menu-nav pattern (Feed/Connect/Convene/Collaborate/Contribute).
// Desktop: underline tab bar.
// Descriptor line under both acts as the tab explainer.
function ConveyEditorialTabs({
  activeTab,
  onTabChange,
  isMobile,
}: {
  activeTab: ConveyTab;
  onTabChange: (tab: ConveyTab) => void;
  isMobile: boolean;
}) {
  const tabBarRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [descriptorKey, setDescriptorKey] = useState(0);

  // Scroll active tab into view on mobile (desktop overflow rare)
  useEffect(() => {
    if (!isMobile && activeTabRef.current && tabBarRef.current) {
      const container = tabBarRef.current;
      const tab = activeTabRef.current;
      const scrollLeft = tab.offsetLeft - container.offsetWidth / 2 + tab.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeTab, isMobile]);

  const handleTabChange = (tab: ConveyTab) => {
    onTabChange(tab);
    setDescriptorKey((k) => k + 1);
  };

  const activeConfig = CONVEY_TABS.find((t) => t.id === activeTab)!;

  if (isMobile) {
    return (
      <div className="border-b border-border -mx-4">
        <div className="px-3 py-1.5 bg-background">
          <div
            className="flex items-center justify-between gap-1 p-1 bg-muted/50 rounded-lg"
            role="tablist"
            aria-label="Convey tabs"
          >
            {CONVEY_TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${label} tab`}
                  title={label}
                  className={cn(
                    'flex items-center justify-center gap-1.5 py-2 rounded-md transition-all duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-background shadow-sm flex-1 px-2'
                      : 'px-2 text-muted-foreground hover:text-foreground hover:bg-background/50',
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} aria-hidden="true" />
                  {isActive && (
                    <span className="text-xs font-medium truncate">{label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <p
          key={descriptorKey}
          className="text-xs text-muted-foreground italic px-4 pb-2 animate-in fade-in duration-300"
        >
          {activeConfig.descriptor}
        </p>
      </div>
    );
  }

  return (
    <div className="border-b border-border">
      {/* Desktop underline tab bar */}
      <div ref={tabBarRef} className="flex gap-6 overflow-x-auto scrollbar-hide px-0">
        {CONVEY_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : undefined}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'relative whitespace-nowrap pb-3 pt-1 text-sm font-medium transition-colors shrink-0',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive ? 'text-dna-forest font-semibold' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-dna-forest rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      <p
        key={descriptorKey}
        className="text-xs text-muted-foreground italic px-0 pt-2 pb-3 animate-in fade-in duration-300"
      >
        {activeConfig.descriptor}
      </p>
    </div>
  );
}

// ─── Main Hub ────────────────────────────────────────────────────────
export default function ConveyStoryHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ConveyTab>('pulse');
  const [selectedCategory, setSelectedCategory] = useState<StoryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const composer = useUniversalComposer();
  const { isMobile } = useMobile();
  const mobileHeaderRef = useRef<HTMLDivElement>(null);
  const mobileHeaderPadding = useMobileHeaderHeight(mobileHeaderRef);

  // Derive feed params from editorial tab
  const feedParams = tabToFeedParams(activeTab, user?.id);

  // Fetch stories
  const {
    feedItems: stories,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteUniversalFeed({
    viewerId: user?.id || '',
    tab: feedParams.tab,
    authorId: feedParams.authorId,
    postType: 'story',
    rankingMode: 'latest',
  });

  // Filter stories by category. Defensive: enforce post_type === 'story'
  // AND a non-empty story_type. Anything else is logged once and excluded.
  const filteredStories = useMemo(() => {
    const valid: typeof stories = [];
    const rejected: Array<{ id: string; reason: string; post_type?: string; story_type?: string | null }> = [];
    for (const s of stories) {
      const isStoryPost = (s as { post_type?: string }).post_type === 'story';
      if (!isStoryPost) {
        rejected.push({ id: s.post_id, reason: 'post_type!=story', post_type: (s as { post_type?: string }).post_type, story_type: s.story_type ?? null });
        continue;
      }
      if (!s.story_type) {
        rejected.push({ id: s.post_id, reason: 'missing story_type', post_type: 'story', story_type: null });
        continue;
      }
      valid.push(s);
    }
    if (rejected.length > 0 && import.meta.env.DEV) {
      console.warn('[ConveyStoryHub] excluded non-story items from story grid', rejected);
    }
    let result = valid;
    if (selectedCategory !== 'all') {
      result = result.filter((s) => s.story_type === selectedCategory);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q.length > 0) {
      result = result.filter((s) => {
        const title = (s.title ?? '').toLowerCase();
        const subtitle = (s.subtitle ?? '').toLowerCase();
        const content = (s.content ?? '').toLowerCase();
        return title.includes(q) || subtitle.includes(q) || content.includes(q);
      });
    }
    return result;
  }, [stories, selectedCategory, searchQuery]);

  // Get trending stories (top engaged) — restricted to validated story items.
  const trendingStories = useMemo(() => {
    return [...filteredStories]
      .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
      .slice(0, 4);
  }, [filteredStories]);

  // Group by story_type for sections (validated set only)
  const impactStories = filteredStories.filter((s) => s.story_type === 'impact').slice(0, 3);
  const spotlightStories = filteredStories.filter((s) => s.story_type === 'spotlight').slice(0, 4);
  const updateStories = filteredStories.filter((s) => s.story_type === 'update').slice(0, 4);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-background to-muted/20">
        <div className="p-4 rounded-lg bg-dna-gold/10 mb-6">
          <BookOpen className="h-12 w-12 text-dna-gold" />
        </div>
        <h1 className="text-h1 font-serif mb-3">Stories from the Diaspora</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Discover inspiring narratives, share your journey, and connect through the power of storytelling.
        </p>
        <Button onClick={() => navigate('/auth')} size="lg" className="bg-dna-gold hover:bg-dna-gold/90">
          Sign In to Explore
        </Button>
      </div>
    );
  }

  // ─── Desktop Left Sidebar ──────────────────────────────────────────
  const leftColumn = isMobile ? null : (
    <div className="space-y-6">
      {/* Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4 text-dna-gold" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {categoryPills.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-2.5 rounded-xl text-sm transition-all',
                  isActive
                    ? 'bg-dna-gold/10 text-dna-gold font-medium'
                    : 'text-muted-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Story Types Info */}
      <Card className="border-dna-gold/20 bg-gradient-to-br from-dna-gold/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-dna-gold" />
            Story Types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.values(STORY_TYPE_CONFIG).slice(0, 4).map((config) => (
            <div key={config.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <span className="text-base">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{config.label}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{config.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  // ─── Main Center Content ───────────────────────────────────────────
  const centerColumn = (
    <div className="space-y-4">
      {/* Sticky Header */}
      <div
        className={cn(
          'bg-background/95 backdrop-blur-sm z-10',
          isMobile ? 'sticky top-0 pt-1 pb-0 -mx-4 px-4' : 'pb-0'
        )}
      >
        {/* Title Row */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-xl bg-gradient-to-br from-dna-gold to-amber-600 shadow-lg shrink-0',
                isMobile ? 'p-2' : 'p-2.5'
              )}
            >
              <BookOpen className={cn('text-white', isMobile ? 'h-5 w-5' : 'h-6 w-6')} />
            </div>
            <div>
              <h1 className={cn('font-bold tracking-tight', isMobile ? 'text-xl' : 'text-2xl')}>
                Convey
              </h1>
              <p className="text-xs text-muted-foreground hidden md:block">
                The diaspora's living publication
              </p>
            </div>
          </div>

          <Button
            onClick={() => composer.open('story')}
            size="sm"
            className="bg-dna-gold hover:bg-dna-gold/90 text-white shadow-md h-8 px-3"
          >
            <PenSquare className="h-4 w-4" />
            {!isMobile && <span className="ml-2">Write</span>}
          </Button>
        </div>

        {/* Editorial Tab Bar */}
        <ConveyEditorialTabs
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedCategory('all');
          }}
          isMobile={!!isMobile}
        />

        {/* Category Pills (only on Pulse tab) */}
        {activeTab === 'pulse' && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
            {categoryPills.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full whitespace-nowrap transition-all',
                    'text-xs font-medium border shrink-0 px-3 py-1.5',
                    isActive
                      ? 'bg-dna-gold text-white border-dna-gold'
                      : 'bg-background border-border hover:border-dna-gold/50'
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-white' : 'text-muted-foreground')} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Trending Section (Pulse tab, All category only) */}
      {activeTab === 'pulse' && selectedCategory === 'all' && <ConveyTrendingSection />}

      {/* Category Sections when viewing Pulse + All */}
      {activeTab === 'pulse' && selectedCategory === 'all' && !isLoading && (
        <>
          {impactStories.length > 0 && (
            <ConveyCategorySection
              title="Impact Stories"
              icon={<Target className="h-4 w-4" />}
              stories={impactStories}
              color="text-emerald-600"
              layout="featured"
              onSeeAll={() => setSelectedCategory('impact')}
            />
          )}
          {updateStories.length > 0 && (
            <ConveyCategorySection
              title="Latest Updates"
              icon={<Megaphone className="h-4 w-4" />}
              stories={updateStories}
              color="text-blue-600"
              layout="horizontal"
              onSeeAll={() => setSelectedCategory('update')}
            />
          )}
          {spotlightStories.length > 0 && (
            <ConveyCategorySection
              title="Community Spotlights"
              icon={<Star className="h-4 w-4" />}
              stories={spotlightStories}
              color="text-amber-600"
              layout="grid"
              onSeeAll={() => setSelectedCategory('spotlight')}
            />
          )}
        </>
      )}

      {/* Filtered Feed (non-Pulse tabs or filtered category) */}
      {(selectedCategory !== 'all' || activeTab !== 'pulse') && (
        <div className="space-y-4">
          {/* Curated tab header */}
          {activeTab === 'curated' && (
            <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
              <Mpatapo className="h-3 w-3 text-dna-forest" />
              Selected by DIA based on your diaspora profile and engagement
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {activeTab === 'my_voice'
                  ? 'Your voice matters'
                  : activeTab === 'saved'
                  ? 'Nothing saved yet'
                  : activeTab === 'my_circle'
                  ? 'Your circle is quiet'
                  : activeTab === 'curated'
                  ? 'Building your curation'
                  : 'No stories yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {activeTab === 'my_voice'
                  ? 'Share your first story with the diaspora'
                  : activeTab === 'saved'
                  ? 'Bookmark stories you want to revisit'
                  : activeTab === 'my_circle'
                  ? 'Stories from your connections will appear here'
                  : activeTab === 'curated'
                  ? 'DIA is learning your interests to surface relevant stories'
                  : 'Be the first to share in this category'}
              </p>
              {(activeTab === 'my_voice' || activeTab === 'pulse') && (
                <Button onClick={() => composer.open('story')} className="bg-dna-gold hover:bg-dna-gold/90">
                  <PenSquare className="h-4 w-4 mr-2" />
                  Write a Story
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStories.map((story) => (
                <ConveyEditorialCard key={story.post_id} story={story} />
              ))}
            </div>
          )}

          {/* Load More */}
          {hasNextPage && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More Stories'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ─── Right Sidebar ─────────────────────────────────────────────────
  const rightColumn = isMobile ? null : (
    <div className="space-y-6">
      <DiaContextual pillar="convey" collapsed={false} compact />

      {/* Write CTA Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="h-24 bg-gradient-to-br from-dna-gold via-amber-500 to-orange-500 relative">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-bold text-lg drop-shadow-md">Share Your Story</h3>
            <p className="text-white/80 text-xs">Inspire the diaspora with your journey</p>
          </div>
        </div>
        <CardContent className="pt-4">
          <Button onClick={() => composer.open('story')} className="w-full bg-dna-gold hover:bg-dna-gold/90">
            <PenSquare className="h-4 w-4 mr-2" />
            Start Writing
          </Button>
        </CardContent>
      </Card>

      {/* Trending Mini List */}
      {trendingStories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Hot Right Now
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {trendingStories.slice(0, 3).map((story, i) => (
              <div key={story.post_id} className="flex items-start gap-2">
                <span className="text-lg font-bold text-muted-foreground/30">{i + 1}</span>
                <ConveyMiniCard story={story} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Why Stories Matter */}
      <Card className="border-dna-gold/20 bg-gradient-to-br from-dna-gold/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-dna-gold" />
            Why Stories Matter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p className="flex items-start gap-2">
            <span className="text-dna-gold mt-0.5">•</span>
            <span>Build credibility and attract opportunities</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-dna-gold mt-0.5">•</span>
            <span>Inspire others with your journey</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-dna-gold mt-0.5">•</span>
            <span>Create social proof for the movement</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {isMobile && (
        <div
          ref={mobileHeaderRef}
          className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border md:hidden"
        >
          <DnaMobileHeader
            bubble={{
              kind: 'search',
              placeholder: 'Search stories...',
              value: searchQuery,
              onChange: setSearchQuery,
            }}
          />
        </div>
      )}
      <div
        className="min-h-screen bg-background pb-bottom-nav md:pb-0"
        style={isMobile ? { paddingTop: mobileHeaderPadding || 56 } : undefined}
      >
        <LayoutController
          leftColumn={leftColumn}
          centerColumn={centerColumn}
          rightColumn={rightColumn}
        />
      </div>

      {/* Mobile: Floating DIA button */}
      {isMobile && <DiaContextual pillar="convey" floatingButton />}

      <UniversalComposer
        isOpen={composer.isOpen}
        mode={composer.mode}
        context={composer.context}
        isSubmitting={composer.isSubmitting}
        onClose={composer.close}
        onModeChange={composer.switchMode}
        successData={composer.successData}
        onSubmit={composer.submit}
        onDismissSuccess={composer.dismissSuccess}
      />
    </>
  );
}
