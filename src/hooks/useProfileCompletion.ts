/**
 * useProfileCompletion - Sprint 12B
 *
 * Checks user's profile and activity to determine which onboarding
 * steps are complete. Steps auto-complete based on database state.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfileStep {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
  module?: string;
  priority: 'required' | 'recommended' | 'optional';
}

interface ProfileCompletionState {
  stepsCompleted: string[];
  guideDismissed: boolean;
  guideMinimized: boolean;
}

export function useProfileCompletion() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Fetch profile completion state from DB
  const { data: completionState } = useQuery({
    queryKey: ['profile-completion', user?.id],
    queryFn: async (): Promise<ProfileCompletionState> => {
      if (!user?.id) return { stepsCompleted: [], guideDismissed: false, guideMinimized: false };

      const { data, error } = await db
        .from('profile_completion')
        .select('steps_completed, guide_dismissed, guide_minimized')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) {
        return { stepsCompleted: [], guideDismissed: false, guideMinimized: false };
      }

      return {
        stepsCompleted: data.steps_completed as string[] || [],
        guideDismissed: data.guide_dismissed as boolean || false,
        guideMinimized: data.guide_minimized as boolean || false,
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  // Fetch activity data for exploration steps
  const { data: activityData } = useQuery({
    queryKey: ['profile-activity', user?.id],
    queryFn: async () => {
      if (!user?.id) return { hasConnection: false, hasPost: false, hasEventView: false, hasSpaceMembership: false, hasOpportunityView: false };

      const [connectionsRes, postsRes, spacesRes] = await Promise.all([
        supabase
          .from('connections')
          .select('id')
          .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .eq('status', 'accepted')
          .limit(1),
        supabase
          .from('posts')
          .select('id')
          .eq('author_id', user.id)
          .limit(1),
        supabase
          .from('space_members')
          .select('id')
          .eq('user_id', user.id)
          .limit(1),
      ]);

      return {
        hasConnection: (connectionsRes.data?.length ?? 0) > 0,
        hasPost: (postsRes.data?.length ?? 0) > 0,
        hasSpaceMembership: (spacesRes.data?.length ?? 0) > 0,
        // These are harder to check without a view tracking table, mark as complete if in stepsCompleted
        hasEventView: false,
        hasOpportunityView: false,
      };
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileData = profile as any;
  const steps: ProfileStep[] = [
    // Required
    {
      id: 'photo',
      label: 'Add profile photo',
      description: 'People connect 3x more with a face',
      isComplete: !!(profileData?.avatar_url),
      priority: 'required',
    },
    {
      id: 'headline',
      label: 'Write your headline',
      description: 'Tell the diaspora who you are in one line',
      isComplete: !!(profileData?.headline),
      priority: 'required',
    },
    {
      id: 'location',
      label: 'Set your location',
      description: 'Connect with people in your city and region',
      isComplete: !!(profileData?.current_country || profileData?.location || profileData?.country || profileData?.current_city),
      priority: 'required',
    },

    // Recommended
    {
      id: 'bio',
      label: 'Write your bio',
      description: 'Share your story with the community',
      isComplete: !!profileData?.bio && (profileData.bio as string).length > 20,
      priority: 'recommended',
    },
    {
      id: 'skills',
      label: 'Add your skills',
      description: 'Help DIA match you with opportunities',
      isComplete: Array.isArray(profileData?.skills) && (profileData.skills as string[]).length > 0,
      priority: 'recommended',
      module: 'CONNECT',
    },
    {
      id: 'sectors',
      label: 'Select your sectors',
      description: 'Customize your feed and discovery',
      isComplete: Array.isArray(profileData?.sectors) && (profileData.sectors as string[]).length > 0,
      priority: 'recommended',
    },

    // Exploration (complete by USING the platform)
    {
      id: 'first_connection',
      label: 'Make your first connection',
      description: 'Find someone in your sector',
      isComplete: activityData?.hasConnection || completionState?.stepsCompleted.includes('first_connection') || false,
      priority: 'optional',
      module: 'CONNECT',
    },
    {
      id: 'first_event',
      label: 'Browse an event',
      description: "See what's happening in the diaspora",
      isComplete: completionState?.stepsCompleted.includes('first_event') || false,
      priority: 'optional',
      module: 'CONVENE',
    },
    {
      id: 'first_space',
      label: 'Explore a space',
      description: 'Find a collaboration that needs you',
      isComplete: activityData?.hasSpaceMembership || completionState?.stepsCompleted.includes('first_space') || false,
      priority: 'optional',
      module: 'COLLABORATE',
    },
    {
      id: 'first_opportunity',
      label: 'View an opportunity',
      description: 'Discover what the network needs',
      isComplete: completionState?.stepsCompleted.includes('first_opportunity') || false,
      priority: 'optional',
      module: 'CONTRIBUTE',
    },
    {
      id: 'first_post',
      label: 'Create your first post',
      description: 'Share your voice with the diaspora',
      isComplete: activityData?.hasPost || completionState?.stepsCompleted.includes('first_post') || false,
      priority: 'optional',
      module: 'CONVEY',
    },
  ];

  const completedCount = steps.filter((s) => s.isComplete).length;
  const totalSteps = steps.length;
  const completionPercentage = Math.round((completedCount / totalSteps) * 100);
  const requiredComplete = steps.filter((s) => s.priority === 'required').every((s) => s.isComplete);
  const allComplete = completedCount === totalSteps;
  const guideDismissed = completionState?.guideDismissed || allComplete;
  const guideMinimized = completionState?.guideMinimized || false;

  // Mutation to mark a step as complete
  const markStepComplete = useMutation({
    mutationFn: async (stepId: string) => {
      if (!user?.id) return;

      const currentSteps = completionState?.stepsCompleted || [];
      if (currentSteps.includes(stepId)) return;

      const updatedSteps = [...currentSteps, stepId];

      await db
        .from('profile_completion')
        .upsert({
          user_id: user.id,
          steps_completed: updatedSteps,
          updated_at: new Date().toISOString(),
          completed_at: updatedSteps.length === totalSteps ? new Date().toISOString() : null,
        }, { onConflict: 'user_id' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-completion', user?.id] });
    },
  });

  // Mutation to dismiss the guide
  const dismissGuide = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await db
        .from('profile_completion')
        .upsert({
          user_id: user.id,
          guide_dismissed: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-completion', user?.id] });
    },
  });

  // Mutation to toggle minimized state
  const toggleMinimized = useMutation({
    mutationFn: async (minimized: boolean) => {
      if (!user?.id) return;
      await db
        .from('profile_completion')
        .upsert({
          user_id: user.id,
          guide_minimized: minimized,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-completion', user?.id] });
    },
  });

  return {
    steps,
    completedCount,
    totalSteps,
    completionPercentage,
    requiredComplete,
    allComplete,
    guideDismissed,
    guideMinimized,
    markStepComplete: markStepComplete.mutate,
    dismissGuide: dismissGuide.mutate,
    toggleMinimized: toggleMinimized.mutate,
  };
}
