import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { PenSquare, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Profile } from '@/services/profilesService';
import { UniversalFeedInfinite } from '@/components/feed/UniversalFeedInfinite';
import { useUniversalComposer } from '@/hooks/useUniversalComposer';
import { UniversalComposer } from '@/components/composer/UniversalComposer';
import { FeedTab } from '@/types/feed';
import { Mpatapo } from '@/components/icons/adinkra';

interface DashboardFeedColumnProps {
  profile: Profile;
  isOwnProfile: boolean;
}

export default function DashboardFeedColumn({ profile, isOwnProfile }: DashboardFeedColumnProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FeedTab>('network');
  const composer = useUniversalComposer();

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Feed</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Discover what's happening in your network
          </p>
        </div>
        {isOwnProfile && (
          <Button
            onClick={() => composer.open('post')}
            className="bg-primary hover:bg-primary/90"
            size="lg"
          >
            <PenSquare className="h-4 w-4 mr-2" />
            Start a post
          </Button>
        )}
      </div>

      {isOwnProfile && (
        <Card className="p-4 mb-4">
          <button
            onClick={() => composer.open('post')}
            className="w-full text-left px-4 py-3 rounded-full border border-input bg-background hover:bg-accent transition-colors text-muted-foreground"
          >
            Start a post...
          </button>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => composer.open('post')}
              className="gap-2"
            >
              <PenSquare className="h-4 w-4" />
              Post
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => composer.open('story')}
              className="gap-2"
            >
              <Mpatapo className="h-4 w-4" />
              Story
            </Button>
          </div>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FeedTab)}>
        <TabsList className="w-full">
          <TabsTrigger value="network" className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            Network
          </TabsTrigger>
          <TabsTrigger value="my_posts" className="flex-1">
            <Mpatapo className="h-4 w-4 mr-2" />
            My Posts
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <UniversalFeedInfinite
        viewerId={user.id}
        tab={activeTab}
        surface="home"
        emptyMessage={
          activeTab === 'my_posts'
            ? "You haven't posted anything yet"
            : "Your network hasn't posted yet"
        }
        emptyAction={
          isOwnProfile ? (
            <Button onClick={() => composer.open('post')} className="mt-4">
              <PenSquare className="h-4 w-4 mr-2" />
              Create Your First Post
            </Button>
          ) : undefined
        }
      />

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
    </div>
  );
}
