import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Eye, Share2 } from 'lucide-react';
import { ROUTES } from '@/config/routes';

interface ImpactProfileLinkProps {
  username: string;
  fullName: string;
  influenceScore?: number;
  isVerified?: boolean;
  className?: string;
  showActions?: boolean;
}

export const ImpactProfileLink: React.FC<ImpactProfileLinkProps> = ({
  username,
  fullName,
  influenceScore,
  isVerified,
  className = "",
  showActions = false
}) => {
  const profileUrl = ROUTES.profile.view(username);
  
  const getInfluenceLevel = (score: number) => {
    if (score >= 1000) return { label: 'Expert', color: 'bg-dna-gold text-white' };
    if (score >= 500) return { label: 'Influencer', color: 'bg-dna-copper text-white' };
    if (score >= 200) return { label: 'Contributor', color: 'bg-dna-emerald text-white' };
    if (score >= 50) return { label: 'Engaged', color: 'bg-dna-mint text-dna-forest' };
    return { label: 'Starting', color: 'bg-neutral-200 text-neutral-700' };
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}${profileUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${fullName}'s Impact Profile`,
          text: `Check out ${fullName}'s impact profile on DNA`,
          url: url,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(url);
      }
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200 hover:border-dna-emerald/30 transition-colors ${className}`}>
      <Link to={profileUrl} className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="font-medium text-dna-forest truncate">{fullName}</p>
            {isVerified && (
              <Badge variant="secondary" className="text-xs bg-dna-emerald/10 text-dna-emerald">
                Verified
              </Badge>
            )}
          </div>
          <p className="text-sm text-neutral-500">@{username}</p>
          {influenceScore !== undefined && (
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-neutral-600">{influenceScore} influence points</span>
              <Badge className={`text-xs ${getInfluenceLevel(influenceScore).color}`}>
                {getInfluenceLevel(influenceScore).label}
              </Badge>
            </div>
          )}
        </div>
      </Link>
      
      {showActions && (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hover:bg-dna-emerald/10"
          >
            <Link to={profileUrl}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="hover:bg-dna-emerald/10"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hover:bg-dna-emerald/10"
          >
            <a href={profileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
};