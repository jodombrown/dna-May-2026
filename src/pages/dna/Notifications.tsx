import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { DnaMobileHubShell } from '@/components/mobile/DnaMobileHubShell';
import { UnifiedNotificationPanel } from '@/components/notifications/UnifiedNotificationPanel';

const DnaNotifications = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <DnaMobileHubShell bubble={{ kind: 'static', placeholder: 'Notifications' }}>
      <UnifiedNotificationPanel variant="page" />
    </DnaMobileHubShell>
  );
};

export default DnaNotifications;
