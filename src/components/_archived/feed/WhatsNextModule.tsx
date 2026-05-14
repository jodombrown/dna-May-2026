import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWhatsNext } from '@/hooks/useWhatsNext';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, FolderKanban, HandHeart, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Mpatapo } from '@/components/icons/adinkra';

const PILLAR_COLORS = {
  connect: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  convene: 'bg-copper-500/10 text-copper-700 dark:text-copper-400',
  collaborate: 'bg-green-500/10 text-green-700 dark:text-green-400',
  contribute: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  convey: 'bg-copper-500/10 text-copper-700 dark:text-copper-400',
};

const ICON_MAP: Record<string, any> = {
  users: Users,
  calendar: Calendar,
  'folder-kanban': FolderKanban,
  'hand-heart': HandHeart,
  'file-text': FileText,
  'arrow-right': ArrowRight,
};

export function WhatsNextModule() {
  const navigate = useNavigate();
  const { data: recommendations, isLoading } = useWhatsNext();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mpatapo className="h-5 w-5 text-primary" />
            What's Next
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mpatapo className="h-5 w-5 text-primary" />
            What's Next
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Keep engaging with the network to get personalized recommendations!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mpatapo className="h-5 w-5 text-primary" />
          What's Next
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec) => {
          const Icon = ICON_MAP[rec.icon] || Mpatapo;
          return (
            <div
              key={rec.id}
              className="group p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => navigate(rec.route)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm leading-tight">{rec.title}</h4>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs capitalize ${PILLAR_COLORS[rec.pillar]} shrink-0`}
                    >
                      {rec.pillar}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {rec.description}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs -ml-2 group-hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(rec.route);
                    }}
                  >
                    Take action
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
