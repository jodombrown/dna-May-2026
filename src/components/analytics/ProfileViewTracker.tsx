import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileViewTrackerProps {
  profileId: string;
  viewType?: string;
}

/**
 * ProfileViewTracker - Automatically tracks profile views
 *
 * Records when users view profiles with:
 * - Spam prevention (max 1 view per hour)
 * - Notifications (first view of the day)
 * - Own profile exclusion
 */
export const ProfileViewTracker: React.FC<ProfileViewTrackerProps> = ({
  profileId,
  viewType = 'profile_page'
}) => {
  const { user } = useAuth();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per mount
    if (hasTracked.current) return;

    const trackView = async () => {
      // Don't track if viewing own profile or not logged in
      if (!user || user.id === profileId) return;

      try {
        // Re-point onto live log_profile_view(p_profile_id, p_view_type).
        // Viewer identity is derived server-side from auth.uid(); p_view_type
        // carries the view context (profile_page / connection_card / …).
        const { error } = await supabase.rpc('log_profile_view', {
          p_profile_id: profileId,
          p_view_type: viewType,
        });

        if (error) {
          return;
        }

        hasTracked.current = true;
      } catch (err) {
        // Fail silently - view tracking is not critical
      }
    };

    // Track after a short delay to ensure user actually landed on page
    const timer = setTimeout(trackView, 2000);

    return () => clearTimeout(timer);
  }, [profileId, user]);

  return null;
};