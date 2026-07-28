import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useMobile } from '@/hooks/useMobile';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Sankofa,
  Nkonsonkonson,
  FuntunfunefuDenkyemfunefu,
  Adinkrahene,
  Mpatapo,
} from '@/components/icons/adinkra';
import { FIVE_CS, type FiveCId, type FiveCAdinkraKey, type FiveCEntry } from '@/content/fiveCs.content';

const ICONS: Record<FiveCAdinkraKey, React.FC<{ className?: string }>> = {
  sankofa: Sankofa,
  nkonsonkonson: Nkonsonkonson,
  funtunfunefu: FuntunfunefuDenkyemfunefu,
  adinkrahene: Adinkrahene,
  mpatapo: Mpatapo,
};

interface FiveCDetailSheetProps {
  openId: FiveCId | null;
  onOpenChange: (id: FiveCId | null) => void;
}

/**
 * Right-side sheet on desktop, vaul drawer on mobile. Same content as the
 * fact-sheet screenshots (4-8). Left/right arrows move between C's inside
 * the sheet.
 */
export const FiveCDetailSheet: React.FC<FiveCDetailSheetProps> = ({ openId, onOpenChange }) => {
  const navigate = useNavigate();
  const { isMobile } = useMobile();

  const entry: FiveCEntry | undefined = openId
    ? FIVE_CS.find((c) => c.id === openId)
    : undefined;
  const entryIndex = entry ? FIVE_CS.findIndex((c) => c.id === entry.id) : -1;
  const hasPrevious = entryIndex > 0;
  const hasNext = entryIndex >= 0 && entryIndex < FIVE_CS.length - 1;

  const cycle = useCallback(
    (delta: 1 | -1) => {
      if (!entry) return;
      const idx = FIVE_CS.findIndex((c) => c.id === entry.id);
      const next = FIVE_CS[idx + delta];
      if (!next) return;
      onOpenChange(next.id);
    },
    [entry, onOpenChange],
  );

  useEffect(() => {
    if (!entry) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') cycle(1);
      if (e.key === 'ArrowLeft') cycle(-1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [entry, cycle]);

  const Body = entry ? (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="px-6 pb-8 space-y-6 overflow-y-auto">
      <Section label="Overview">
        <p className="text-sm text-muted-foreground leading-relaxed">{entry.overview}</p>
      </Section>

      <Section label="What You Can Do">
        <ul className="space-y-2">
          {entry.whatYouCanDo.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
              <span
                className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.colorToken }}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section label="Who It Is For">
        <p className="text-sm text-muted-foreground leading-relaxed">{entry.whoItIsFor}</p>
      </Section>

      <Section label="How It Connects To The Other C's">
        <p className="text-sm text-muted-foreground leading-relaxed">{entry.howItConnects}</p>
      </Section>

      <Section label="What Is Coming">
        <ul className="space-y-2">
          {entry.whatIsComing.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
              <span
                className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.colorToken }}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      <div className="pt-2 flex items-center justify-between gap-2">
        <div>
          {hasPrevious && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => cycle(-1)}
            aria-label="Previous C"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          )}
        </div>
        <div>
          {hasNext && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => cycle(1)}
            aria-label="Next C"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          )}
        </div>
      </div>

      <div className="pointer-events-none sticky bottom-0 flex justify-center bg-gradient-to-t from-background via-background/80 to-transparent py-2">
        <ChevronDown className="h-5 w-5 animate-bounce text-muted-foreground" aria-hidden="true" />
      </div>
    </div>
  ) : null;

  const Header = entry ? (
    <div
      className="px-6 py-5"
      style={{
        background: `linear-gradient(135deg, ${entry.colorToken} 0%, ${entry.colorToken} 60%, hsl(var(--muted)) 140%)`,
      }}
    >
      <div className="flex items-center gap-3 text-primary-foreground">
        <div className="w-10 h-10 rounded-md bg-background/20 flex items-center justify-center">
          {(() => {
            const Icon = ICONS[entry.adinkra];
            return <Icon className="w-6 h-6 text-primary-foreground" />;
          })()}
        </div>
        <div className="font-display text-2xl font-semibold">{entry.name}</div>
      </div>
      <p className="mt-2 text-sm text-primary-foreground/90">{entry.sheetTagline}</p>
    </div>
  ) : null;

  if (isMobile) {
    return (
      <Drawer open={!!entry} onOpenChange={(o) => !o && onOpenChange(null)}>
        <DrawerContent className="flex max-h-[92dvh] p-0">
          <DrawerHeader className="p-0 text-left">
            {Header}
            <DrawerTitle className="sr-only">{entry?.name}</DrawerTitle>
            <DrawerDescription className="sr-only">{entry?.sheetTagline}</DrawerDescription>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col pt-4">{Body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={!!entry} onOpenChange={(o) => !o && onOpenChange(null)}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="p-0 text-left space-y-0">
          {Header}
          <SheetTitle className="sr-only">{entry?.name}</SheetTitle>
          <SheetDescription className="sr-only">{entry?.sheetTagline}</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col pt-4">{Body}</div>
      </SheetContent>
    </Sheet>
  );
};

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
      {label}
    </div>
    {children}
  </div>
);

export default FiveCDetailSheet;
