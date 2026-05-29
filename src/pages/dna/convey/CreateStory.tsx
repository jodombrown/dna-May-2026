import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConveyItemForm } from '@/components/convey/ConveyItemForm';
import { useCreateConveyItem, useCheckExistingImpactDraft } from '@/hooks/useConveyMutations';
import { useImpactSummary, generateImpactTitle, generateImpactSubtitle, generateImpactBody } from '@/hooks/useImpactSummary';
import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabaseHelpers';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { ConveyItemType } from '@/types/conveyTypes';
import LayoutController from '@/components/LayoutController';
import { LeftNav } from '@/components/layout/columns/LeftNav';
import { RightWidgets } from '@/components/layout/columns/RightWidgets';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useIsAdmin } from '@/hooks/useIsAdmin';

export default function CreateStory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const spaceId = searchParams.get('space_id');
  const eventId = searchParams.get('event_id');
  const needId = searchParams.get('need_id');
  const requestedType = searchParams.get('type') as ConveyItemType | null;
  
  const [prefillData, setPrefillData] = useState<any>(null);

  const createMutation = useCreateConveyItem();
  const checkExistingDraft = useCheckExistingImpactDraft();
  const { trackEvent } = useAnalytics();

  // Fetch space details if space_id is provided
  const { data: space, isLoading: isLoadingSpace } = useQuery({
    queryKey: ['space-for-story', spaceId],
    queryFn: async () => {
      if (!spaceId) return null;

      const { data, error } = await supabaseClient
        .from('spaces')
        .select('id, name, visibility, region')
        .eq('id', spaceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!spaceId,
  });

  // Fetch event details if event_id is provided
  const { data: event, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['event-for-story', eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const { data, error } = await supabaseClient
        .from('events')
        .select('id, title')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Fetch impact summary if this is an impact story
  const { data: impactSummary, isLoading: isLoadingImpact } = useImpactSummary(spaceId || undefined, needId || undefined);

  // Check for existing draft when creating impact story
  useEffect(() => {
    if (requestedType === 'impact' && spaceId && needId) {
      checkExistingDraft.mutate({ spaceId, needId }, {
        onSuccess: (existing) => {
          if (existing) {
            // Redirect to existing draft
            navigate(`/dna/convey/edit/${existing.slug || existing.id}`);
          }
        },
      });
    }
  }, [requestedType, spaceId, needId]);

  // Generate prefill data for impact stories
  useEffect(() => {
    if (requestedType === 'impact' && impactSummary && !prefillData) {
      const title = generateImpactTitle(impactSummary.space.name, impactSummary.need.title);
      const subtitle = generateImpactSubtitle(
        impactSummary.contributions.validated_count,
        impactSummary.contributions.first_validated_at,
        impactSummary.contributions.last_validated_at
      );
      const body = generateImpactBody(impactSummary);

      setPrefillData({
        type: 'impact' as const,
        title,
        subtitle,
        body,
        region: impactSummary.space.region || '',
        visibility: 'public' as const,
      });
    }
  }, [requestedType, impactSummary, prefillData]);

  // Check if user is admin (canonical RPC-based check)
  const { isAdmin } = useIsAdmin();

  const handleSubmit = async (formData: any) => {
    const data = {
      ...formData,
      primary_space_id: spaceId || undefined,
      primary_event_id: eventId || undefined,
      primary_need_id: needId || undefined,
      focus_areas: impactSummary?.space.focus_areas || [],
    };

    const result = await createMutation.mutateAsync(data);

    // Navigate to the story detail page
    if (result?.slug) {
      navigate(`/dna/story/${result.slug}`);
    } else if (spaceId && space) {
      navigate(`/dna/collaborate/spaces/${space.slug || spaceId}#updates`);
    } else {
      navigate('/dna/convey');
    }
  };

  const handleCancel = () => {
    if (spaceId && space) {
      navigate(`/dna/collaborate/spaces/${space.slug || spaceId}#updates`);
    } else {
      navigate('/dna/convey');
    }
  };

  if (isLoadingSpace || isLoadingEvent || (requestedType === 'impact' && isLoadingImpact)) {
    return (
      <LayoutController
        leftColumn={<LeftNav />}
        centerColumn={
          <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        }
        rightColumn={<RightWidgets />}
      />
    );
  }

  const pageTitle = requestedType === 'impact' 
    ? 'Create an Impact Story' 
    : spaceId 
      ? 'Post an Update' 
      : 'Create a Story';
  
  const pageDescription = requestedType === 'impact'
    ? 'Share the impact of validated contributions with the DNA community.'
    : spaceId
      ? 'Share progress, milestones, or news with your space members.'
      : 'Share a story, update, or impact highlight with the DNA community.';

  return (
    <LayoutController
      leftColumn={<LeftNav />}
      centerColumn={
        <div className="container max-w-3xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dna/convey')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Convey
          </Button>

          <div className="mb-6">
            <h1 className="text-h1 font-serif mb-2">Create Story</h1>
            <p className="text-muted-foreground">
              Share a story about diaspora impact, innovation, or connection
            </p>
          </div>

          <ConveyItemForm
            onSubmit={async (formData) => {
              createMutation.mutate(formData, {
                onSuccess: (data) => {
                  // Navigate to the story detail page
                  navigate(`/dna/story/${data.slug}`);
                },
              });
            }}
            onCancel={() => navigate('/dna/convey')}
          />
        </div>
      }
      rightColumn={<RightWidgets />}
    />
  );
}
