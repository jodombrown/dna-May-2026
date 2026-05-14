import { useState } from 'react';
import { useMobile } from '@/hooks/useMobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { CURRENCY_VISUALS } from './currencyConfig';
import { trackContributeEvent } from '@/lib/contributeAnalytics';

interface CapitalComingSoonCardProps {
  surface: 'editor' | 'renderer';
}

const CAPITAL = CURRENCY_VISUALS.capital;
const BODY = `Coming after we've built the trust ladder. For now, we're focused on Expertise, Network, and Resources - the contributions that build the social fabric that makes capital trustworthy.`;

export function CapitalComingSoonCard({ surface }: CapitalComingSoonCardProps) {
  const [open, setOpen] = useState(false);
  const { isMobile } = useMobile();
  const Icon = CAPITAL.icon;

  const handleOpen = () => {
    setOpen(true);
    trackContributeEvent({ type: 'capital_coming_soon_viewed', surface });
  };

  const Body = (
    <div className="px-4 pb-6 space-y-3">
      <p className="text-sm leading-relaxed text-foreground/90">{BODY}</p>
      <p className="text-xs text-muted-foreground">
        Capital authoring will arrive in a future phase. The architecture is ready;
        the trust ladder isn't yet.
      </p>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-disabled="true"
        aria-describedby="capital-card-help"
        className="w-full text-left bg-card border rounded-lg overflow-hidden opacity-60 hover:opacity-75 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ borderLeft: `4px solid ${CAPITAL.barHex}` }}
      >
        <div className="px-4 py-4 min-h-[44px]">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" style={{ color: CAPITAL.barHex }} aria-hidden="true" />
              <span
                className="text-xs uppercase tracking-wide font-medium"
                style={{ color: CAPITAL.labelHex }}
              >
                Capital
              </span>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Coming soon
            </Badge>
          </div>
          <h3 className="text-base md:text-lg font-medium leading-snug">
            Capital contributions
          </h3>
          <p id="capital-card-help" className="mt-2 text-xs text-muted-foreground">
            Tap to read why we're sequencing this.
          </p>
        </div>
      </button>

      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <div data-vaul-drawer-handle="" className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />
            <DrawerHeader>
              <DrawerTitle>Capital contributions</DrawerTitle>
            </DrawerHeader>
            {Body}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Capital contributions</DialogTitle>
            </DialogHeader>
            {Body}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
