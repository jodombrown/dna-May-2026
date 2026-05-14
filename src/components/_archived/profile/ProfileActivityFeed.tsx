/**
 * DNA | FEED - Profile Activity Feed
 * 
 * Shows a user's activity via the universal feed with pinned posts at the top.
 */

import React from 'react';
import { UniversalFeed } from '@/components/feed/UniversalFeed';
import { PinnedPostsSection } from './PinnedPostsSection';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sankofa } from '@/components/icons/adinkra';

interface ProfileActivityFeedProps {
  profileUserId: string;
  profileUsername: string;
  isOwnProfile: boolean;
}

export const ProfileActivityFeed: React.FC<ProfileActivityFeedProps> = ({
  profileUserId,
  profileUsername,
  isOwnProfile,
}) => {
  const { user } = useAuth();

  if (!user) return null;

  const emptyMessage = isOwnProfile
    ? "You haven't shared anything yet."
    : `@${profileUsername} hasn't shared anything yet.`;

  const emptyAction = isOwnProfile ? (
    <Button variant="outline" className="mt-4">
      <Sankofa className="w-4 h-4 mr-2" />
      Create Your First Post
    </Button>
  ) : undefined;

  return (
    <div>
      {/* Pinned Posts Section */}
      <PinnedPostsSection
        profileUserId={profileUserId}
        currentUserId={user.id}
        isOwnProfile={isOwnProfile}
      />

      {/* Regular Activity Feed */}
      <UniversalFeed
        viewerId={user.id}
        authorId={profileUserId}
        tab="all"
        emptyMessage={emptyMessage}
        emptyAction={emptyAction}
      />
    </div>
  );
};
