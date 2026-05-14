import React from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedHeader from '@/components/UnifiedHeader';
import { ProfileStrengthCard } from '@/components/profile/ProfileStrengthCard';
import { SuggestedConnections } from '@/components/connect/SuggestedConnections';
import { UpcomingEventsWidget } from '@/components/connect/UpcomingEventsWidget';
import { ActiveSpacesWidget } from '@/components/connect/ActiveSpacesWidget';
import { MyContributionsWidget } from '@/components/connect/MyContributionsWidget';
import { calculateProfileCompletion } from '@/components/profile/ProfileCompletionBar';
import { ProfileUnlockModal } from '@/components/profile/ProfileUnlockModal';
import { useProfileUnlock } from '@/hooks/useProfileUnlock';
import type { Profile } from '@/services/profilesService';
import type { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MateMasie } from '@/components/icons/adinkra';

interface MyDNAHubProps {
  profile: Profile;
  currentUser: User;
}

const MyDNAHub: React.FC<MyDNAHubProps> = ({ profile, currentUser }) => {
  const navigate = useNavigate();
  const completionScore = calculateProfileCompletion(profile);
  const { showUnlockModal, closeUnlockModal } = useProfileUnlock();

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <MateMasie className="h-7 w-7 text-dna-copper" />
            Welcome back, {profile.first_name || profile.full_name}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening in your DNA network
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Strength */}
          <div className="lg:col-span-1 space-y-6">
            <ProfileStrengthCard completionScore={completionScore} />
          </div>

          {/* Center & Right Columns - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Suggested Connections - Emphasized */}
            <SuggestedConnections userId={currentUser.id} limit={5} />

            {/* Two Column Grid for Events & Spaces */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UpcomingEventsWidget userId={currentUser.id} limit={3} />
              <ActiveSpacesWidget userId={currentUser.id} limit={3} />
            </div>

            {/* Contributions Summary - Full Width */}
            <MyContributionsWidget userId={currentUser.id} />
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/dna/connect/discover')}
          >
            <CardContent className="pt-6 text-center">
              <div className="text-3xl mb-2">🔍</div>
              <p className="font-semibold text-sm">Discover</p>
              <p className="text-xs text-muted-foreground">Find connections</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/dna/convene/events')}
          >
            <CardContent className="pt-6 text-center">
              <div className="text-3xl mb-2">📅</div>
              <p className="font-semibold text-sm">Convene</p>
              <p className="text-xs text-muted-foreground">Join events</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/dna/convene/groups')}
          >
            <CardContent className="pt-6 text-center">
              <div className="text-3xl mb-2">🤝</div>
              <p className="font-semibold text-sm">Collaborate</p>
              <p className="text-xs text-muted-foreground">Join spaces</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/dna/contribute')}
          >
            <CardContent className="pt-6 text-center">
              <div className="text-3xl mb-2">💝</div>
              <p className="font-semibold text-sm">Contribute</p>
              <p className="text-xs text-muted-foreground">Make impact</p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Profile Unlock Modal */}
      <ProfileUnlockModal
        isOpen={showUnlockModal}
        onClose={closeUnlockModal}
        completionScore={completionScore}
      />
    </div>
  );
};

export default MyDNAHub;
