import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import LayoutController from '@/components/LayoutController';
import { LeftNav } from '@/components/layout/columns/LeftNav';
import { RightWidgets } from '@/components/layout/columns/RightWidgets';
import { useMobile } from '@/hooks/useMobile';
import { 
  MapPin, 
  Briefcase, 
  Globe, 
  Linkedin, 
  Github,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  Edit,
  User,
  ArrowLeft
} from 'lucide-react';

const DnaUserDashboard = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useMobile();

  // Fetch profile data
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['dna-profile', username],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .maybeSingle();

        // Return null on error - don't throw, let UI handle gracefully
        if (error) {
          return null;
        }
        return data;
      } catch (err) {
        // Catch any unexpected errors - NEVER throw to avoid ErrorBoundary
        return null;
      }
    },
    retry: 1,
    // Never throw errors to React Query - always return graceful null
    throwOnError: false,
  });

  // Fetch contribution history (placeholder - adjust table name based on your schema)
  const { data: contributions } = useQuery({
    queryKey: ['dna-contributions', profile?.id],
    queryFn: async () => {
      // TODO: Replace with actual contributions table once it exists
      return [];
    },
    enabled: !!profile?.id,
  });

  const isOwnProfile = user?.id === profile?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Graceful fallback for missing profile OR any query error
  if (!profile || error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-h1 font-serif mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The user you're looking for doesn't exist or is temporarily unavailable.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={() => navigate('/dna/connect/discover')}>
              Discover Members
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: Use LayoutController with profile content
  if (!isMobile) {
    return (
      <LayoutController
        leftColumn={<LeftNav />}
        centerColumn={
          <div className="max-w-4xl mx-auto">
            {/* Banner */}
            {profile.banner_url && (
              <div 
                className="h-48 bg-cover bg-center rounded-lg mb-4"
                style={{ backgroundImage: `url(${profile.banner_url})` }}
              />
            )}

            {/* Profile Header */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex gap-6">
                  <Avatar className="w-24 h-24 border-4 border-background">
                    <AvatarImage src={profile.avatar_url || undefined} loading="lazy" />
                    <AvatarFallback className="text-2xl">
                      {profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-h1 font-serif">{profile.full_name || profile.username}</h1>
                        {profile.headline && (
                          <p className="text-lg text-muted-foreground mt-1">{profile.headline}</p>
                        )}
                      </div>
                      {isOwnProfile && (
                        <Button onClick={() => navigate('/dna/profile/edit')}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                      {profile.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {profile.location}
                        </div>
                      )}
                      {profile.profession && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {profile.profession}
                        </div>
                      )}
                    </div>

                    {profile.bio && (
                      <p className="mt-4 text-muted-foreground">{profile.bio}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for additional content */}
            <Tabs defaultValue="activity">
              <TabsList>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">
                      No activity yet
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="about" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    {profile.bio ? (
                      <p>{profile.bio}</p>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No bio available
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        }
        rightColumn={<RightWidgets />}
      />
    );
  }

  // Mobile: Use simplified profile view
  return (
    <div className="min-h-screen bg-background">
      
      {/* Banner */}
      {profile.banner_url && (
        <div 
          className="h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${profile.banner_url})` }}
        />
      )}

      <div className="container max-w-6xl mx-auto px-4 pb-bottom-nav md:pb-0">
        {!isOwnProfile && (
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mt-4 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        
        {/* Header Card */}
        <Card className={profile.banner_url ? '-mt-16 relative' : 'mt-2'}>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <Avatar className="w-24 h-24 border-4 border-background">
                <AvatarImage src={profile.avatar_url || undefined} loading="lazy" />
                <AvatarFallback className="text-2xl">
                  {profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              {/* Name & Actions */}
              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-h2 font-serif">{profile.full_name || profile.username}</h1>
                    </div>
                    {profile.headline && (
                      <p className="text-muted-foreground mt-1">{profile.headline}</p>
                    )}
                  </div>
                </div>

                {/* Quick Info */}
                <div className="flex flex-wrap gap-2 sm:gap-4 mt-4 text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </div>
                  )}
                  {profile.profession && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {profile.profession}
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.website_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4 mr-2" />
                        Website
                      </a>
                    </Button>
                  )}
                  {profile.linkedin_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="w-4 h-4 mr-2" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {profile.email && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${profile.email}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="activity">Activity</TabsTrigger>}
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-6">

            {/* Professional Background */}
            {(profile.bio || profile.profession) && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Professional Background</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.profession && (
                    <div>
                      <h3 className="font-medium mb-2">Current Role</h3>
                      <p>{profile.profession}</p>
                    </div>
                  )}

                  {profile.bio && (
                    <div>
                      <h3 className="font-medium mb-2">About</h3>
                      <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
                    </div>
                  )}

                  {profile.skills && profile.skills.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Skills & Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill: string) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => navigate(`/dna/connect/discover?skill=${encodeURIComponent(skill)}`)}
                            aria-label={`Find members with skill: ${skill}`}
                            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                          >
                            <Badge className="hover:bg-primary/90 cursor-pointer transition-colors">
                              {skill}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Impact Areas */}
            {profile.impact_areas && profile.impact_areas.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Impact Areas</h2>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.impact_areas.map((area: string) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => navigate(`/dna/connect/discover?focus=${encodeURIComponent(area)}`)}
                        aria-label={`Find members focused on: ${area}`}
                        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                      >
                        <Badge variant="secondary" className="hover:bg-secondary/70 cursor-pointer transition-colors">
                          {area}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contributions" className="mt-6">
            {contributions && contributions.length > 0 ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Verified Contributions</h2>
                    <Badge variant="outline">
                      {contributions.length} contribution{contributions.length !== 1 && 's'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contributions.map((contrib: any) => (
                      <div key={contrib.id} className="flex gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        {contrib.opportunity?.organization?.logo_url && (
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={contrib.opportunity.organization.logo_url} />
                            <AvatarFallback>
                              {contrib.opportunity.organization.name?.[0] || 'O'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium">{contrib.opportunity?.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {contrib.opportunity?.organization?.name}
                          </p>
                          {contrib.description && (
                            <p className="text-sm mt-2">{contrib.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(contrib.started_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </div>
                            {contrib.hours_contributed > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {contrib.hours_contributed} hours
                              </div>
                            )}
                            {contrib.verified_at && (
                              <div className="flex items-center gap-1 text-primary">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No contributions yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile 
                      ? "Start contributing to opportunities to build your track record"
                      : "This user hasn't completed any verified contributions yet"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">Activity feed coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default DnaUserDashboard;
