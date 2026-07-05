import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sankofa,
  Nkonsonkonson,
  FuntunfunefuDenkyemfunefu,
  Adinkrahene,
  Mpatapo,
} from '@/components/icons/adinkra';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MESSAGING_ENABLED } from '@/config/featureFlags';

/**
 * LeftNav - Standard left navigation for DNA platform
 * Used in DASHBOARD_HOME, CONNECT_MODE, and CONVEY_MODE.
 *
 * Icons: Five C's use their reserved Adinkra symbols
 * (see docs/ICON_USAGE_GUIDE.md). Messages uses lucide MessageCircle.
 */
export function LeftNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Sankofa, label: 'Connect', path: '/dna/connect' },
    { icon: Nkonsonkonson, label: 'Convene', path: '/dna/convene' },
    { icon: FuntunfunefuDenkyemfunefu, label: 'Collaborate', path: '/dna/collaborate' },
    { icon: Adinkrahene, label: 'Contribute', path: '/dna/contribute' },
    { icon: Mpatapo, label: 'Convey', path: '/dna/convey' },
    // BD063 hide-and-freeze: DM/group messaging is OUT at v0.0 (see MESSAGING_ENABLED).
    ...(MESSAGING_ENABLED
      ? [{ icon: MessageCircle, label: 'Messages', path: '/dna/messages' }]
      : []),
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-2 sticky top-4">
        <Card className="p-3">
          <nav className="space-y-1" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              const label = `Open ${item.label}`;

              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => navigate(item.path)}
                      aria-label={label}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="w-4 h-4 mr-2" aria-hidden="true" />
                      {item.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </Card>
      </div>
    </TooltipProvider>
  );
}
