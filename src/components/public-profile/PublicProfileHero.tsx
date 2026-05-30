/**
 * PublicProfileHero Component
 *
 * Hero section for public profiles with avatar, name, headline, location, and stats.
 * Designed for above-the-fold impact and SEO.
 */

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Globe2,
  Briefcase,
  Calendar,
  Users,
  ExternalLink,
  Linkedin,
  Link as LinkIcon,
} from 'lucide-react';

interface PublicProfileHeroProps {
  profile: {
    full_name?: string;
    username?: string;
    avatar_url?: string | null;
    headline?: string | null;
    profession?: string | null;
    current_country?: string | null;
    current_city?: string | null;
    primary_origin_country?: string | null;
    ethnic_heritage?: string[] | null;
    linkedin_url?: string | null;
    website_url?: string | null;
    created_at?: string | null;
  };
  activity?: {
    connections_count?: number;
    events?: Array<{ id: string }>;
  };
  onConnect?: () => void;
  isLoggedIn?: boolean;
  connectionStatus?: string;
  connectionLoading?: boolean;
}

export const PublicProfileHero = ({
  profile,
  activity,
  onConnect,
  isLoggedIn,
  connectionStatus,
  connectionLoading,
}: PublicProfileHeroProps) => {
  const displayName = profile.full_name || profile.username || 'DNA Member';
  const displayRole = profile.profession || profile.headline;
  const connectionsCount = activity?.connections_count || 0;
  const eventsCount = activity?.events?.length || 0;

  // Format member since date
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : null;

  // Build heritage display
  const heritageDisplay = [
    profile.primary_origin_country,
    ...(profile.ethnic_heritage || []),
  ].filter(Boolean).slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-dna-forest/5 via-dna-emerald/5 to-dna-mint/5 border-b">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-4 border-background shadow-xl mb-4">
            <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="text-2xl sm:text-3xl bg-dna-mint text-dna-forest font-bold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Name and username */}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
            {displayName}
          </h1>
          <p className="text-muted-foreground text-sm mb-3">
            @{profile.username}
          </p>

          {/* Headline/Role */}
          {displayRole && (
            <div className="flex items-center text-muted-foreground mb-3">
              <Briefcase className="w-4 h-4 mr-2 shrink-0" />
              <span className="text-sm sm:text-base">{displayRole}</span>
            </div>
          )}

          {/* Location and Heritage */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground mb-4">
            {(profile.current_city || profile.current_country) && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1 shrink-0 text-dna-copper" />
                <span>
                  {profile.current_city
                    ? `${profile.current_city}, ${profile.current_country}`
                    : profile.current_country}
                </span>
              </div>
            )}
            {heritageDisplay.length > 0 && (
              <div className="flex items-center">
                <Globe2 className="w-4 h-4 mr-1 shrink-0 text-dna-forest" />
                <span>{heritageDisplay.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2 mb-6">
            {profile.linkedin_url && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                asChild
              >
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              </Button>
            )}
            {profile.website_url && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                asChild
              >
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <LinkIcon className="w-4 h-4" />
                  Website
                </a>
              </Button>
            )}
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground border-t border-b py-4 w-full max-w-md">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span className="font-semibold text-foreground">{connectionsCount}</span>
              <span>Connections</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className="font-semibold text-foreground">{eventsCount}</span>
              <span>Events</span>
            </div>
            {memberSince && (
              <div className="flex items-center gap-1.5">
                <span>Member since</span>
                <span className="font-semibold text-foreground">{memberSince}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfileHero;
