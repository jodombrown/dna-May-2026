/**
 * Connection Card - Apple News Style
 * Displays an established connection with message and profile actions
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  User, 
  Users,
  MoreHorizontal,
  MapPin,
  Share2,
  Bookmark
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useMutualConnections } from '@/hooks/useMutualConnections';
import { ProfileViewTracker } from '@/components/analytics/ProfileViewTracker';
import { messageService } from '@/services/messageService';
import { MESSAGING_ENABLED } from '@/config/featureFlags';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getErrorMessage } from '@/lib/errorLogger';

interface ConnectionCardProps {
  connection: {
    id: string;
    full_name: string;
    avatar_url?: string;
    professional_role?: string;
    headline?: string;
    location?: string;
    username?: string;
  };
  connectionId?: string;
  onMessage?: (userId: string) => void;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({ connection, connectionId, onMessage }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { mutualCount, hasMutualConnections } = useMutualConnections(user?.id, connection.id);

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';
  };

  const handleMessage = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) return;
    
    try {
      const conversation = await messageService.getOrCreateConversation(connection.id);
      navigate(`/dna/messages/${conversation.id}`);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to start conversation',
        variant: 'destructive',
      });
    }
  };

  const handleViewProfile = () => {
    navigate(`/dna/${connection.username || connection.id}`);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const profileUrl = `${window.location.origin}/dna/${connection.username || connection.id}`;
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: 'Link copied',
      description: 'Profile link copied to clipboard',
    });
  };

  // Build metadata string
  const getMetadataString = (): string => {
    const parts: string[] = [];
    if (connection.location) parts.push(connection.location);
    if (hasMutualConnections) parts.push(`${mutualCount} mutual${mutualCount !== 1 ? 's' : ''}`);
    return parts.join(' · ');
  };

  const metadata = getMetadataString();

  return (
    <>
      <ProfileViewTracker profileId={connection.id} viewType="connection_card" />
      
      <Card 
        className="bg-card/60 backdrop-blur-sm border-border/30 overflow-hidden cursor-pointer hover:bg-card/80 transition-colors"
        onClick={handleViewProfile}
      >
        <div className="p-4">
          {/* Apple News style: Two columns - Text left, Image right */}
          <div className="flex gap-3">
            {/* Left column: Content */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Source badge - role */}
              {connection.professional_role && (
                <Badge 
                  variant="secondary" 
                  className="w-fit mb-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary border-0"
                >
                  {connection.professional_role}
                </Badge>
              )}

              {/* Headline: Name */}
              <h3 className="font-semibold text-base text-foreground leading-tight mb-1 line-clamp-2">
                {connection.full_name}
              </h3>

              {/* Subheadline: Headline */}
              <p className="text-sm text-muted-foreground leading-snug line-clamp-2 mb-2">
                {connection.headline || 'DNA Community Member'}
              </p>

              {/* Metadata footer */}
              <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground/70">
                {connection.location && <MapPin className="h-3 w-3 shrink-0" />}
                <span className="truncate">{metadata || 'Connected'}</span>
              </div>
            </div>

            {/* Right column: Square avatar + overflow menu */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              {/* Square avatar with rounded corners */}
              <Avatar className="h-20 w-20 rounded-xl">
                <AvatarImage
                  src={connection.avatar_url || ''}
                  alt={connection.full_name}
                  className="object-cover"
                  loading="lazy"
                />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold rounded-xl">
                  {getInitials(connection.full_name)}
                </AvatarFallback>
              </Avatar>

              {/* Overflow menu */}
              <DropdownMenu>
                <DropdownMenuTrigger 
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {/* BD063 hide-and-freeze: Message entry hidden while DM messaging is OUT at v0.0. */}
                  {MESSAGING_ENABLED && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMessage(); }}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Message
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewProfile(); }}>
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Profile
                  </DropdownMenuItem>
                  {hasMutualConnections && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
                        <Users className="h-3 w-3" />
                        {mutualCount} mutual connection{mutualCount !== 1 ? 's' : ''}
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

export default ConnectionCard;
