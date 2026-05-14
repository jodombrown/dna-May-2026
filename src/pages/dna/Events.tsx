import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import LayoutController from '@/components/LayoutController';
import { LeftNav } from '@/components/layout/columns/LeftNav';
import { RightWidgets } from '@/components/layout/columns/RightWidgets';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const DnaEvents = () => {
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
        <Calendar className="w-6 h-6 text-primary" />
        <h1 className="text-h2 font-serif">Events</h1>
      </div>
      <Card className="p-6">
        <p className="text-muted-foreground">Events feed coming soon...</p>
      </Card>
    </div>
  );

  return (
    <LayoutController
      leftColumn={<LeftNav />}
      centerColumn={centerColumn}
      rightColumn={<RightWidgets variant="convene" />}
    />
  );
};

export default DnaEvents;
