/**
 * Personalized "For You" Feed
 *
 * Thin wrapper around UniversalFeedInfinite. The ONLY difference between
 * For You, All, and Mine is the (tab, rankingMode) pair passed to the same
 * RPC and the same mapper. Rendering, pagination, and card chrome are
 * shared verbatim - see src/test/feedTabConsistency.test.tsx.
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UniversalFeedInfinite } from '@/components/feed/UniversalFeedInfinite';
import { Compass } from 'lucide-react';

export const PersonalizedFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Card className="p-8 text-center space-y-4">
        <Compass className="h-12 w-12 mx-auto text-dna-copper opacity-50" />
        <p className="text-muted-foreground text-sm">Sign in to see your personalized feed.</p>
        <Button onClick={() => navigate('/auth')} className="bg-dna-copper hover:bg-dna-copper/90">
          Sign In
        </Button>
      </Card>
    );
  }

  return (
    <UniversalFeedInfinite
      viewerId={user.id}
      tab="for_you"
      rankingMode="top"
      emptyMessage="Your personalized feed is being prepared"
    />
  );
};
