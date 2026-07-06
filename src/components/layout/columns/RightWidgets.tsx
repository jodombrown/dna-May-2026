import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Calendar } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';

interface RightWidgetsProps {
  variant?: 'default' | 'connect' | 'convene' | 'convey';
}

/**
 * RightWidgets - Adaptive right column widgets
 * Changes based on the current mode (connect, convene, etc.)
 */
export function RightWidgets({ variant = 'default' }: RightWidgetsProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 sticky top-4">
      {/* Trending / Suggested Content */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">
            {variant === 'connect' && 'Suggested Connections'}
            {variant === 'convene' && 'Upcoming Events'}
            {variant === 'convey' && 'Trending Stories'}
            {variant === 'default' && 'Trending'}
          </h3>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => {
              if (variant === 'connect') navigate('/dna/connect/discover');
              else if (variant === 'convene') navigate('/dna/convene');
              else if (variant === 'convey') navigate('/dna/convey');
              else navigate('/dna/feed');
            }}
            className="text-left hover:text-foreground hover:underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Explore {variant === 'default' ? 'the feed' : variant}
          </button>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <MateMasie className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Quick Actions</h3>
        </div>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => navigate('/dna/convene/my-events')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Host an Event
          </Button>
        </div>
      </Card>
    </div>
  );
}
