import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { MateMasie } from '@/components/icons/adinkra';

import { ConnectNudges } from '@/components/connect/ConnectNudges';
import { MyProfilePreview } from '@/components/profile/MyProfilePreview';
import { ProfileCompletionNudge } from '@/components/profile/ProfileCompletionNudge';
import { RecentActivity } from '@/components/profile/RecentActivity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, TrendingUp, Eye, PenSquare } from 'lucide-react';

const DnaMe = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-3 lg:py-6">
        <div className="mb-3 lg:mb-6">
          <h1 className="text-2xl lg:text-h1 font-serif mb-1">My DNA Hub</h1>
          <p className="text-sm text-muted-foreground">
            Your personal dashboard for the DNA platform
          </p>
        </div>

        {/* DIA Nudges */}
        <ConnectNudges />

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          {/* Left Column - Profile & Strength */}
          <div className="space-y-6">
            <MyProfilePreview profile={profile} />
            
            {/* View/Edit Profile Actions */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/dna/${profile.username}`)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View My Public Profile
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/dna/profile/edit')}
                >
                  <PenSquare className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
            
            <ProfileCompletionNudge 
              variant="card" 
              threshold={80} 
              showMissingFields={true}
            />
          </div>

          {/* Right Column - Quick Actions & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start gap-2"
                    onClick={() => navigate('/dna/connect/discover')}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Users className="w-5 h-5 text-dna-copper" />
                      <span className="font-semibold">Discover Members</span>
                    </div>
                    <span className="text-xs text-muted-foreground text-left">
                      Find and connect with diaspora members
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start gap-2"
                    onClick={() => navigate('/dna/convene/events')}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Calendar className="w-5 h-5 text-dna-emerald" />
                      <span className="font-semibold">Browse Events</span>
                    </div>
                    <span className="text-xs text-muted-foreground text-left">
                      Explore upcoming events and spaces
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start gap-2"
                    onClick={() => navigate('/dna/contribute/needs')}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <MateMasie className="w-5 h-5 text-dna-gold" />
                      <span className="font-semibold">Opportunities</span>
                    </div>
                    <span className="text-xs text-muted-foreground text-left">
                      Apply to jobs, grants, and programs
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start gap-2"
                    onClick={() => navigate('/dna/connect/network')}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <TrendingUp className="w-5 h-5 text-dna-forest" />
                      <span className="font-semibold">My Network</span>
                    </div>
                    <span className="text-xs text-muted-foreground text-left">
                      View connections and requests
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity - populated with real data */}
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DnaMe;
