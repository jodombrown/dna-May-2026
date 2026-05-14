/**
 * Public Profile Landing View
 * A focused, visually appealing profile view for non-logged-in visitors.
 * Designed to intrigue visitors and drive DNA sign-ups.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Globe, 
  Briefcase, 
  UserPlus, 
  ArrowLeft,
  Users,
  Target,
  Heart,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  Link2
} from 'lucide-react';
import { ProfileV2Bundle } from '@/types/profileV2';
import { BANNER_GRADIENTS, BannerGradientKey } from '@/lib/constants/bannerGradients';
import { PublicProfileSEO } from '@/components/public-profile';
import { motion } from 'framer-motion';
import { getFlag } from '@/lib/countryFlags';

const getCountryFlag = getFlag;

const BIO_TRUNCATE_LENGTH = 500;

interface PublicProfileLandingViewProps {
  bundle: ProfileV2Bundle;
}

// About section with paragraph preservation and read more
const AboutSection: React.FC<{ bio: string }> = ({ bio }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = bio.length > BIO_TRUNCATE_LENGTH;
  
  // Preserve paragraph formatting by splitting on newlines
  const formatBio = (text: string) => {
    return text.split(/\n\n|\r\n\r\n/).map((paragraph, index) => (
      <p key={index} className="mb-4 last:mb-0">
        {paragraph.split(/\n|\r\n/).map((line, lineIndex, arr) => (
          <React.Fragment key={lineIndex}>
            {line}
            {lineIndex < arr.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    ));
  };

  const displayBio = shouldTruncate && !isExpanded 
    ? bio.slice(0, BIO_TRUNCATE_LENGTH) + '...'
    : bio;

  return (
    <Card className="mb-6 max-w-2xl mx-auto">
      <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          About
        </h2>
        <div className="text-muted-foreground leading-relaxed">
          {formatBio(displayBio)}
        </div>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Read less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Read more
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
};

const PublicProfileLandingView: React.FC<PublicProfileLandingViewProps> = ({ bundle }) => {
  const navigate = useNavigate();
  const { profile, tags } = bundle;

  // Get banner style
  const getBannerStyle = (): React.CSSProperties => {
    const bannerType = profile.banner_type || 'gradient';
    const bannerGradient = profile.banner_gradient || 'dna';
    const bannerUrl = profile.banner_url;

    if (bannerType === 'image' && bannerUrl) {
      return {
        backgroundImage: `url(${bannerUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    
    if (bannerType === 'gradient' && bannerGradient) {
      const gradient = BANNER_GRADIENTS[bannerGradient as BannerGradientKey];
      return { background: gradient?.css || BANNER_GRADIENTS.dna.css };
    }
    
    return { background: BANNER_GRADIENTS.dna.css };
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    return (profile?.full_name || profile?.username || 'DN')
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Collect tags to display
  const displaySkills = tags?.skills?.slice(0, 4) || [];
  const displayInterests = tags?.interests?.slice(0, 4) || tags?.impact_areas?.slice(0, 4) || [];

  // Get heritage flag
  const originFlag = getCountryFlag(profile.country_of_origin);
  const locationFlag = getCountryFlag(profile.current_country || profile.location);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: {
        duration: 0.2,
        ease: "easeOut" as const
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags */}
      <PublicProfileSEO
        username={profile.username}
        fullName={profile.full_name || profile.username || 'DNA Member'}
        firstName={profile.first_name}
        lastName={profile.last_name}
        headline={profile.headline || profile.professional_role}
        bio={profile.bio}
        avatarUrl={profile.avatar_url}
        company={profile.company}
        linkedinUrl={(profile as any).linkedin_url}
        websiteUrl={(profile as any).website_url}
        memberSince={profile.created_at}
      />

      {/* Minimal Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
      >
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-sm">DNA</span>
          </Link>
          <Button 
            onClick={() => navigate('/waitlist')}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Join DNA
          </Button>
        </div>
      </motion.header>

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="h-40 sm:h-52 md:h-64 w-full relative pt-14"
        style={getBannerStyle()}
      >
        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        {/* Cultural pattern overlay - subtle */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </motion.div>

      {/* Profile Content */}
      <motion.div 
        className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Avatar & Name Section */}
        <motion.div 
          className="flex flex-col items-center text-center mb-8"
          variants={itemVariants}
        >
          <div className="relative mb-4">
            <motion.div 
              className="p-1 rounded-full"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--dna-emerald)), hsl(var(--dna-forest)))',
                boxShadow: '0 4px 20px hsla(183, 28%, 28%, 0.3)'
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.3 }}
            >
              <Avatar className="w-28 h-28 sm:w-36 sm:h-36 border-4 border-background">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </div>

          <motion.h1 
            className="text-2xl sm:text-3xl font-bold text-foreground mb-1"
            variants={itemVariants}
          >
            {profile.full_name || profile.username}
          </motion.h1>
          <motion.p 
            className="text-muted-foreground text-sm mb-3"
            variants={itemVariants}
          >
            @{profile.username}
          </motion.p>

          {/* Member Badge with Connection Count */}
          <motion.div 
            className="flex items-center gap-3 mb-4"
            variants={itemVariants}
          >
            <Badge variant="secondary" className="text-xs px-3 py-1">
              <BadgeCheck className="w-3 h-3 mr-1" />
              DNA Member
            </Badge>
            {((bundle as any).connectionStats?.acceptedCount || 0) > 0 && (
              <Badge variant="outline" className="text-xs px-3 py-1">
                <Link2 className="w-3 h-3 mr-1" />
                <span className="font-semibold">{(bundle as any).connectionStats?.acceptedCount}</span> connections
              </Badge>
            )}
          </motion.div>

          {/* Headline */}
          {profile.headline && (
            <motion.p 
              className="text-base sm:text-lg text-foreground max-w-lg mb-4"
              variants={itemVariants}
            >
              {profile.headline}
            </motion.p>
          )}

          {/* Meta Info with Heritage Flags */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-6"
            variants={itemVariants}
          >
            {profile.professional_role && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                <span>{profile.professional_role}</span>
                {profile.company && (
                  <span className="text-muted-foreground/70">at {profile.company}</span>
                )}
              </div>
            )}
            {(profile.location || profile.current_country) && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>
                  Based in {locationFlag && <span className="mr-1">{locationFlag}</span>}
                  {profile.location || profile.current_country}
                </span>
              </div>
            )}
            {profile.country_of_origin && (
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>
                  From {originFlag && <span className="mr-1">{originFlag}</span>}
                  {profile.country_of_origin}
                </span>
              </div>
            )}
          </motion.div>

          {/* Primary CTA */}
          <motion.div variants={itemVariants}>
            <Button 
              onClick={() => navigate('/waitlist')}
              size="lg"
              className="bg-primary hover:bg-primary/90 shadow-lg px-8"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Join the Waitlist
            </Button>
          </motion.div>
        </motion.div>

        {/* About Section */}
        {profile.bio && (
          <motion.div variants={itemVariants}>
            <AboutSection bio={profile.bio} />
          </motion.div>
        )}

        {/* Skills & Interests Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8"
          variants={itemVariants}
        >
          {displaySkills.length > 0 && (
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardContent className="pt-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                  <Target className="w-4 h-4" />
                  Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  {displaySkills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {displayInterests.length > 0 && (
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardContent className="pt-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                  <Heart className="w-4 h-4" />
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {displayInterests.map((interest, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* DNA Value Proposition */}
        <motion.div variants={itemVariants}>
          <Card className="max-w-2xl mx-auto mb-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20 overflow-hidden">
            <CardContent className="pt-6 text-center relative">
              <motion.div 
                className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-colors hover:bg-primary/20"
                transition={{ duration: 0.12 }}
              >
                <Users className="w-6 h-6 text-primary" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-2">
                Join the Diaspora Network of Africa
              </h3>
              <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
                Connect with professionals like {profile.first_name || profile.full_name?.split(' ')[0] || 'this member'} who 
                are building bridges between Africa and its global diaspora.
              </p>
              <Button 
                onClick={() => navigate('/waitlist')}
                className="bg-primary hover:bg-primary/90"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Join the Waitlist
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center">
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            © {new Date().getFullYear()} Diaspora Network of Africa
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default PublicProfileLandingView;
