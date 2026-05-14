import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import LayoutController from '@/components/LayoutController';
import { LeftNav } from '@/components/layout/columns/LeftNav';
import { RightWidgets } from '@/components/layout/columns/RightWidgets';
import { Card } from '@/components/ui/card';
import { Users2 } from 'lucide-react';

const DnaGroups = () => {
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

  const centerColumn = (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users2 className="w-6 h-6 text-primary" />
        <h1 className="text-h2 font-serif">Groups</h1>
      </div>
      <Card className="p-6">
        <p className="text-muted-foreground">Groups feed coming soon...</p>
      </Card>
    </div>
  );

  return (
    <LayoutController
      leftColumn={<LeftNav />}
      centerColumn={centerColumn}
      rightColumn={<RightWidgets variant="default" />}
    />
  );
};

export default DnaGroups;
