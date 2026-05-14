import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Users, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MateMasie } from '@/components/icons/adinkra';

export interface DiaProfileCardProps {
  id: string;
  full_name: string;
  headline?: string;
  avatar_url?: string;
  location?: string;
  relevance?: string; // "High match" | "Skills match" | "Location match"
  mutualConnections?: number;
  skills?: string[];
  compact?: boolean;
  onConnect?: (profileId: string) => void;
}

export function DiaProfileCard({
  id,
  full_name,
  headline,
  avatar_url,
  location,
  relevance,
  mutualConnections,
  skills = [],
  compact = false,
  onConnect
}: DiaProfileCardProps) {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/dna/${id}`);
  };

  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConnect?.(id);
  };

  const getRelevanceColor = (rel: string) => {
    switch (rel?.toLowerCase()) {
      case 'high match':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'skills match':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'location match':
        return 'bg-copper-100 text-copper-700 dark:bg-copper-900/30 dark:text-copper-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleViewProfile}
        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer text-left group w-full"
      >
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={avatar_url} alt={full_name} />
          <AvatarFallback className="bg-emerald-100 text-emerald-700">
            {full_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate flex items-center gap-1">
            {full_name}
            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {headline}
          </p>
        </div>
        {relevance && (
          <Badge variant="secondary" className={cn("text-xs shrink-0", getRelevanceColor(relevance))}>
            {relevance}
          </Badge>
        )}
      </button>
    );
  }

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Header with avatar and info */}
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 shrink-0 ring-2 ring-background">
              <AvatarImage src={avatar_url} alt={full_name} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                {full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{full_name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{headline}</p>
              {location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{location}</span>
                </p>
              )}
            </div>
          </div>

          {/* Relevance and mutual connections */}
          <div className="flex items-center gap-2 flex-wrap">
            {relevance && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const slug = relevance.toLowerCase().includes('skill')
                    ? 'skills'
                    : relevance.toLowerCase().includes('location')
                      ? 'location'
                      : 'high';
                  navigate(`/dna/connect/discover?match=${slug}`);
                }}
                aria-label={`Filter discovery by ${relevance}`}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
              >
                <Badge variant="secondary" className={cn("text-xs cursor-pointer hover:opacity-80", getRelevanceColor(relevance))}>
                  <MateMasie className="h-3 w-3 mr-1" />
                  {relevance}
                </Badge>
              </button>
            )}
            {mutualConnections && mutualConnections > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/dna/${id}?tab=mutuals`);
                }}
                aria-label={`View ${mutualConnections} mutual connections`}
                className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 -mx-1"
              >
                <Users className="h-3 w-3" />
                {mutualConnections} mutual{mutualConnections > 1 ? 's' : ''}
              </button>
            )}
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {skills.slice(0, 3).map((skill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dna/connect/discover?skill=${encodeURIComponent(skill)}`);
                  }}
                  aria-label={`Find more profiles with ${skill}`}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                >
                  <Badge variant="outline" className="text-xs font-normal cursor-pointer hover:bg-muted">
                    {skill}
                  </Badge>
                </button>
              ))}
              {skills.length > 3 && (
                <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                  +{skills.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewProfile}
              className="flex-1 h-8 text-xs"
            >
              View Profile
            </Button>
            {onConnect && (
              <Button
                size="sm"
                onClick={handleConnect}
                className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                Connect
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DiaProfileCard;
