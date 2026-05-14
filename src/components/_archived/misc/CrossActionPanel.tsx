import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CROSS_ACTIONS, CrossActionType } from '@/config/crossActions';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MateMasie } from '@/components/icons/adinkra';

interface CrossActionPanelProps {
  type: CrossActionType;
  context?: Record<string, any>;
  title?: string;
}

export function CrossActionPanel({ type, context, title = 'Quick Actions' }: CrossActionPanelProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const actions = (CROSS_ACTIONS[type] as any) || [];

  // Filter out actions that require auth if user is not logged in
  const availableActions = actions.filter((action: any) => !action.requiresAuth || user);

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MateMasie className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {availableActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => navigate(action.route(context))}
            >
              <div className="flex items-start gap-3 w-full">
                <Icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{action.label}</div>
                  {action.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {action.description}
                    </div>
                  )}
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
