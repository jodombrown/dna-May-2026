import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, MessageSquarePlus, TrendingUp, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Exclude 'for_you' from tabs EmptyFeedState handles - it has its own component
type EmptyFeedTab = Exclude<import('@/types/feed').FeedTab, 'for_you'>;

interface EmptyFeedStateProps {
  tab: EmptyFeedTab;
}

export const EmptyFeedState = ({ tab }: EmptyFeedStateProps) => {
  const navigate = useNavigate();

  const getContent = () => {
    switch (tab) {
      case 'network':
        return {
          icon: <UserPlus className="h-12 w-12 text-dna-copper mb-4" />,
          title: "Your Network Feed is Empty",
          description: "Connect with diaspora members to see their posts and updates here.",
          actions: [
            {
              label: "Discover People",
              icon: <UserPlus className="h-4 w-4 mr-2" />,
              onClick: () => navigate('/dna/connect/discover'),
              variant: 'default' as const,
            },
          ],
        };

      case 'my_posts':
        return {
          icon: <MessageSquarePlus className="h-12 w-12 text-dna-copper mb-4" />,
          title: "You Haven't Posted Yet",
          description: "Share your story, insights, or opportunities with the diaspora community.",
          actions: [
            {
              label: "Create Your First Post",
              icon: <MessageSquarePlus className="h-4 w-4 mr-2" />,
              onClick: () => {
                // Scroll to composer at top of page
                window.scrollTo({ top: 0, behavior: 'smooth' });
              },
              variant: 'default' as const,
            },
          ],
        };

      case 'bookmarks':
        return {
          icon: <TrendingUp className="h-12 w-12 text-dna-copper mb-4" />,
          title: "No Bookmarked Posts",
          description: "Save posts you want to revisit later by clicking the bookmark icon.",
          actions: [
            {
              label: "Explore All Posts",
              icon: <TrendingUp className="h-4 w-4 mr-2" />,
              onClick: () => {
                // Navigate to feed with 'all' tab selected
                navigate('/dna/feed');
                // Force a small delay then scroll to top
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
              },
              variant: 'default' as const,
            },
          ],
        };

      default: // 'all'
        return {
          icon: <Compass className="h-12 w-12 text-dna-copper mb-4" />,
          title: "Welcome to DNA!",
          description: "Connect with the diaspora community, share your story, and discover opportunities.",
          actions: [
            {
              label: "Find People to Connect",
              icon: <UserPlus className="h-4 w-4 mr-2" />,
              onClick: () => navigate('/dna/connect/discover'),
              variant: 'default' as const,
            },
            {
              label: "Create Your First Post",
              icon: <MessageSquarePlus className="h-4 w-4 mr-2" />,
              onClick: () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              },
              variant: 'outline' as const,
            },
          ],
        };
    }
  };

  const content = getContent();

  return (
    <Card className="border-2 border-dashed border-dna-copper/30">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        {content.icon}
        <h3 className="text-2xl font-semibold text-foreground mb-2">
          {content.title}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          {content.description}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {content.actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant}
              className={action.variant === 'default' ? 'bg-dna-copper hover:bg-dna-gold' : ''}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
