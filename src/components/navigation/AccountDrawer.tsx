import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Edit, Share2, FileText, Bookmark, Users, Calendar, Settings, HelpCircle, LogOut, Copy, MessageSquare, Linkedin, Twitter, Download, Loader2, ClipboardCheck } from 'lucide-react';
import { useTourProgress } from '@/hooks/useTourProgress';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { AlphaTestGuide } from '@/components/alpha/AlphaTestGuide';
import { FeedbackDrawer } from '@/components/feedback/FeedbackDrawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { MateMasie } from '@/components/icons/adinkra';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useAccountDrawer } from '@/contexts/AccountDrawerContext';
import { toast } from 'sonner';
import { profileRoute } from '@/lib/profileRoute';
import { generateProfilePDF } from '@/lib/generateProfilePDF';

export const AccountDrawer: React.FC = () => {
  const { isOpen, close } = useAccountDrawer();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showTestGuide, setShowTestGuide] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const { isCompleted: tourCompleted, resetTour } = useTourProgress();

  const handleTakeTour = () => {
    if (tourCompleted) {
      resetTour();
    }
    setShowTour(true);
    close();
  };

  const handleViewProfile = () => {
    if (profile?.username) {
      navigate(profileRoute(profile));
      close();
    }
  };

  const handleEditProfile = () => {
    navigate('/dna/profile/edit');
    close();
  };

  const getPublicProfileUrl = () => {
    if (profile?.username) {
      return `${window.location.origin}/u/${profile.username}`;
    }
    return '';
  };

  const handleCopyLink = () => {
    const url = getPublicProfileUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success('Profile link copied to clipboard');
    }
  };

  const handleShareWhatsApp = () => {
    const url = getPublicProfileUrl();
    const text = `Check out ${profile?.display_name || profile?.username}'s profile on DNA - Diaspora Network of Africa`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = getPublicProfileUrl();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleShareTwitter = () => {
    const url = getPublicProfileUrl();
    const text = `Check out ${profile?.display_name || profile?.username}'s profile on DNA - Diaspora Network of Africa`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleNativeShare = async () => {
    const url = getPublicProfileUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.display_name || profile?.username}'s Impact Profile`,
          text: `Check out ${profile?.display_name || profile?.username}'s profile on DNA`,
          url: url,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadPDF = async () => {
    if (!profile) return;
    
    setIsDownloading(true);
    try {
      await generateProfilePDF(profile as any, user?.email);
      toast.success('Profile PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    close();
  };

  const handleSignOut = async () => {
    await signOut();
    close();
    navigate('/');
  };

  if (!user || !profile) return null;

  return (
    <>
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Account</h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Identity Block */}
          <div className="p-6 space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback className="text-2xl">
                {profile.display_name?.[0] || profile.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <h3 className="text-xl font-semibold">{profile.display_name || profile.username}</h3>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
              
              {profile.location && (
                <p className="text-sm text-muted-foreground">
                  {profile.location}
                </p>
              )}

              {profile.bio && (
                <p className="text-sm text-foreground pt-2 line-clamp-2">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Primary Actions */}
            <div className="space-y-2 pt-2">
              <Button 
                onClick={handleViewProfile}
                className="w-full justify-start"
                variant="default"
              >
                <User className="h-4 w-4 mr-2" />
                View full profile
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handleEditProfile}
                  variant="outline"
                  className="justify-start"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline"
                      className="justify-start bg-dna-amber text-foreground hover:bg-dna-amber/90"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-56 bg-background border border-border" 
                    sideOffset={5}
                    style={{ zIndex: 9999 }}
                  >
                    <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                      <Copy className="h-4 w-4 mr-3" />
                      Copy link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareWhatsApp} className="cursor-pointer">
                      <MessageSquare className="h-4 w-4 mr-3" />
                      Share via WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareLinkedIn} className="cursor-pointer">
                      <Linkedin className="h-4 w-4 mr-3" />
                      Share via LinkedIn
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareTwitter} className="cursor-pointer">
                      <Twitter className="h-4 w-4 mr-3" />
                      Share via X (Twitter)
                    </DropdownMenuItem>
                    {typeof navigator !== 'undefined' && navigator.share && (
                      <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
                        <Share2 className="h-4 w-4 mr-3" />
                        Share via...
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer" disabled={isDownloading}>
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 mr-3 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-3" />
                      )}
                      {isDownloading ? 'Generating...' : 'Download PDF'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <Separator />

          {/* Activity Shortcuts */}
          <div className="p-4 space-y-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
              My Activity
            </h4>
            
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigation('/dna/feed?tab=my_posts')}
            >
              <FileText className="h-4 w-4 mr-3" />
              My posts & updates
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigation('/dna/convey?tab=my_stories')}
            >
              <FileText className="h-4 w-4 mr-3" />
              My stories
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigation('/dna/feed?tab=bookmarks')}
            >
              <Bookmark className="h-4 w-4 mr-3" />
              Saved items
            </Button>
          </div>

          <Separator />

          {/* Spaces & Events */}
          <div className="p-4 space-y-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
              Collaborate
            </h4>
            
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigation('/dna/collaborate')}
            >
              <Users className="h-4 w-4 mr-3" />
              My spaces
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigation('/dna/convene/events')}
            >
              <Calendar className="h-4 w-4 mr-3" />
              My events
            </Button>
          </div>

          <Separator />

          {/* Account Section */}
          <div className="p-4 space-y-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
              Account
            </h4>
            
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigation('/dna/settings')}
            >
              <Settings className="h-4 w-4 mr-3" />
              Settings & preferences
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleTakeTour}
            >
              <MateMasie className="h-4 w-4 mr-3" />
              Take Platform Tour
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => { close(); setShowTestGuide(true); }}
            >
              <ClipboardCheck className="h-4 w-4 mr-3" />
              Alpha Test Guide
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => window.open('mailto:aweh@diasporanetwork.africa', '_blank')}
            >
              <HelpCircle className="h-4 w-4 mr-3" />
              Help & feedback
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    {/* Platform Tour Dialog */}
    <OnboardingTour open={showTour} onClose={() => setShowTour(false)} />

    {/* Alpha Test Guide */}
    <AlphaTestGuide
      isOpen={showTestGuide}
      onClose={() => setShowTestGuide(false)}
      onOpenFeedback={() => {
        setShowTestGuide(false);
        setShowFeedback(true);
      }}
    />
    <FeedbackDrawer
      isOpen={showFeedback}
      onClose={() => setShowFeedback(false)}
    />
  </>
  );
};
