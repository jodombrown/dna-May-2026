import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { REBUILD_FLAGS } from '@/lib/rebuildFlags';

interface ProfileContributionsSectionProps {
  userId: string;
  limit?: number;
}

type ContributionType = 'need' | 'offer' | 'badge';

interface ContributionItem {
  id: string;
  type: ContributionType;
  title: string;
  description?: string;
  spaceId: string;
  spaceName?: string;
  status: string;
  created_at: string;
}

export const ProfileContributionsSection: React.FC<ProfileContributionsSectionProps> = (props) => {
  // STUBBED: Phase 2 teardown. Restore in Phase 3 rebuild.
  if (REBUILD_FLAGS.collaborateContributeRebuild) return null;
  return <ProfileContributionsSectionImpl {...props} />;
};

const ProfileContributionsSectionImpl: React.FC<ProfileContributionsSectionProps> = ({
  userId,
  limit = 5
}) => {
  const navigate = useNavigate();

  const { data: contributions, isLoading } = useQuery({
    queryKey: ['profile-contributions', userId],
    queryFn: async () => {
      const allContributions: ContributionItem[] = [];

      // Get needs created by user
      const { data: needs, error: needsError } = await supabase
        .from('contribution_needs')
        .select(`
          id,
          title,
          description,
          status,
          created_at,
          space_id,
          spaces (name)
        `)
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!needsError && needs) {
        needs.forEach((need: { id: string; title: string; description: string | null; status: string; created_at: string; space_id: string; spaces: { name: string } | null }) => {
          allContributions.push({
            id: need.id,
            type: 'need',
            title: need.title,
            description: need.description,
            spaceId: need.space_id,
            spaceName: need.spaces?.name,
            status: need.status,
            created_at: need.created_at,
          });
        });
      }

      // Get offers made by user
      const { data: offers, error: offersError } = await supabase
        .from('contribution_offers')
        .select(`
          id,
          message,
          status,
          created_at,
          space_id,
          spaces (name),
          contribution_needs (title)
        `)
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!offersError && offers) {
        offers.forEach((offer: { id: string; message: string | null; status: string; created_at: string; space_id: string; spaces: { name: string } | null; contribution_needs: { title: string } | null }) => {
          allContributions.push({
            id: offer.id,
            type: 'offer',
            title: offer.contribution_needs?.title || 'Contribution Offer',
            description: offer.message,
            spaceId: offer.space_id,
            spaceName: offer.spaces?.name,
            status: offer.status,
            created_at: offer.created_at,
          });
        });
      }

      // Get validated badges for user (skip if table doesn't exist)
      try {
        const { data: badges, error: badgesError } = await supabase
          .from('contribution_badges' as any)
          .select(`
            id,
            badge_type,
            description,
            created_at,
            space_id,
            spaces (name)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!badgesError && badges) {
          (badges as any[]).forEach((badge: { id: string; badge_type: string | null; description: string | null; created_at: string; space_id: string; spaces: { name: string } | null }) => {
            allContributions.push({
              id: badge.id,
              type: 'badge',
              title: badge.badge_type || 'Contribution Badge',
              description: badge.description,
              spaceId: badge.space_id,
              spaceName: badge.spaces?.name,
              status: 'validated',
              created_at: badge.created_at,
            });
          });
        }
      } catch (e) {
        // Table may not exist yet
      }

      // Sort by most recent
      return allContributions
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Contributions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading contributions...</div>
        </CardContent>
      </Card>
    );
  }

  if (!contributions || contributions.length === 0) {
    return null; // Hide section if no contributions
  }

  const getTypeColor = (type: ContributionType) => {
    switch (type) {
      case 'need':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'offer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'badge':
        return 'bg-copper-100 text-copper-800 dark:bg-copper-900 dark:text-copper-200';
    }
  };

  const getTypeLabel = (type: ContributionType) => {
    switch (type) {
      case 'need':
        return 'Need';
      case 'offer':
        return 'Offer';
      case 'badge':
        return 'Validated';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Contributions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contributions.map((contribution) => (
            <div
              key={`${contribution.type}-${contribution.id}`}
              className="flex items-start justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
              onClick={() => {
                if (contribution.spaceId) {
                  navigate(`/dna/collaborate/spaces/${contribution.spaceId}?tab=contribute`);
                }
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-semibold text-sm">{contribution.title}</h4>
                  <Badge className={`text-xs ${getTypeColor(contribution.type)}`}>
                    {getTypeLabel(contribution.type)}
                  </Badge>
                  {contribution.spaceName && (
                    <Badge variant="outline" className="text-xs">
                      {contribution.spaceName}
                    </Badge>
                  )}
                </div>
                {contribution.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {contribution.description}
                  </p>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
            </div>
          ))}

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => navigate('/dna/contribute')}
          >
            View all contributions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
