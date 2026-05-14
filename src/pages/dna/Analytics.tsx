import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import LayoutController from '@/components/LayoutController';
import { LeftNav } from '@/components/layout/columns/LeftNav';
import { RightWidgets } from '@/components/layout/columns/RightWidgets';
import { Card } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { TierGate } from '@/components/auth/TierGate';
import { checkTierAccess } from '@/services/tierService';
import { UserTier } from '@/types/composer';

const DnaAnalytics = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  // Tier gating — free users cannot access cross-C analytics
  const tierAccess = checkTierAccess(UserTier.FREE, 'canViewCrossCAnalytics');

  const centerColumn = (
    <TierGate
      hasAccess={tierAccess.allowed}
      requiredTier="pro"
      featureLabel="Cross-C Analytics"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-h2 font-serif">Analytics Dashboard</h1>
        </div>
        <Card className="p-6">
          <p className="text-muted-foreground">Analytics content coming soon...</p>
        </Card>
      </div>
    </TierGate>
  );

  return (
    <LayoutController
      leftColumn={<LeftNav />}
      centerColumn={centerColumn}
      rightColumn={<RightWidgets variant="default" />}
    />
  );
};

export default DnaAnalytics;
