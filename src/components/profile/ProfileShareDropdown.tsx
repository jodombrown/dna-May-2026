/**
 * Reusable Profile Share Dropdown
 * Can be used for own profile (AccountDrawer) and for viewing other profiles (PublicProfilePage)
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Copy, MessageSquare, Linkedin, Twitter, Share, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateProfilePDF } from '@/lib/generateProfilePDF';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/config/routes';

interface ProfileShareDropdownProps {
  username: string;
  fullName?: string;
  profile?: any; // For PDF generation
  showDownload?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const ProfileShareDropdown: React.FC<ProfileShareDropdownProps> = ({
  username,
  fullName,
  profile,
  showDownload = true,
  variant = 'outline',
  size = 'icon',
  className = '',
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { user } = useAuth();

  const getPublicProfileUrl = () => {
    return `${window.location.origin}${ROUTES.profile.view(username)}`;
  };

  const displayName = fullName || username || 'this DNA member';

  const handleCopyLink = () => {
    const url = getPublicProfileUrl();
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const handleShareWhatsApp = () => {
    const url = getPublicProfileUrl();
    const text = `Check out ${displayName}'s profile on DNA - Diaspora Network of Africa`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = getPublicProfileUrl();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleShareTwitter = () => {
    const url = getPublicProfileUrl();
    const text = `Check out ${displayName}'s profile on DNA - Diaspora Network of Africa`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleNativeShare = async () => {
    const url = getPublicProfileUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} on DNA`,
          text: `Check out ${displayName}'s profile on DNA - Diaspora Network of Africa`,
          url: url,
        });
      } catch (err) {
        // User cancelled or error - fallback to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadPDF = async () => {
    if (!profile) {
      toast.error('Profile data not available for PDF');
      return;
    }
    
    setIsDownloading(true);
    try {
      // Only carry the owner's email into the PDF for the signed-in user's own profile;
      // a peer-profile export must not leak an email field.
      const isOwnProfile = !!user?.id && profile?.id === user.id;
      await generateProfilePDF(profile, isOwnProfile ? user?.email : undefined);
      toast.success('Profile PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4" />
          {size !== 'icon' && <span className="ml-2">Share</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background border" style={{ zIndex: 9999 }}>
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
        <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
          <Share className="h-4 w-4 mr-3" />
          Share via...
        </DropdownMenuItem>
        
        {showDownload && profile && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDownloadPDF} 
              className="cursor-pointer"
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-3 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-3" />
              )}
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
