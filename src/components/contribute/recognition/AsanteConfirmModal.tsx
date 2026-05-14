/**
 * AsanteConfirmModal — the recognition moment.
 *
 * This is intentionally NOT a "Mark complete" pattern. The visual treatment,
 * copy, and pacing are designed to honor the contribution being recognized.
 */
import React, { useState } from 'react';
import { useMobile } from '@/hooks/useMobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { contributeFulfillmentService } from '@/services/contributeFulfillmentService';
import { AdinkrahenIcon } from './AdinkrahenIcon';

interface AsanteConfirmModalProps {
  fulfillmentId: string;
  fulfillerName: string;
  fulfillerAvatarUrl?: string;
  needTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed?: () => void;
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'DN';
}

const Body: React.FC<{
  fulfillerName: string;
  fulfillerAvatarUrl?: string;
  needTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}> = ({ fulfillerName, fulfillerAvatarUrl, needTitle, onConfirm, onCancel, loading, error }) => (
  <div className="px-5 sm:px-6 pb-6 pt-2 flex flex-col items-center text-center gap-5">
    <div className="relative">
      <Avatar className="w-20 h-20 ring-2 ring-[hsl(var(--dna-emerald,154_32%_42%))/30] ring-offset-2 ring-offset-background">
        <AvatarImage src={fulfillerAvatarUrl} alt={fulfillerName} />
        <AvatarFallback className="text-lg font-semibold bg-[#4A8D77] text-white">
          {initialsOf(fulfillerName)}
        </AvatarFallback>
      </Avatar>
      <div
        className="absolute -bottom-1 -right-1 rounded-full bg-background p-1 text-[#4A8D77]"
        aria-hidden="true"
      >
        <AdinkrahenIcon size={20} strokeWidth={1.75} />
      </div>
    </div>

    <p className="text-[15px] leading-relaxed text-foreground max-w-sm">
      <span className="font-semibold">{fulfillerName}</span> helped you with{' '}
      <span className="italic">"{needTitle}"</span>. Confirming this fulfillment recognizes
      their contribution in the Currency Circulation system.
    </p>

    <div className="flex items-center gap-2 text-xs text-[#2D6A4F] uppercase tracking-[0.18em]">
      <span className="h-px w-8 bg-[#2D6A4F]/30" />
      <span>Asante</span>
      <span className="h-px w-8 bg-[#2D6A4F]/30" />
    </div>

    {error && (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    )}

    <div className="w-full flex flex-col gap-2 pt-1">
      <Button
        onClick={onConfirm}
        disabled={loading}
        className="w-full h-12 bg-[#4A8D77] hover:bg-[#3d7864] text-white text-[15px] font-semibold"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Give Asante'}
      </Button>
      <Button
        onClick={onCancel}
        disabled={loading}
        variant="ghost"
        className="w-full text-[#2D6A4F] hover:bg-[#2D6A4F]/5 hover:text-[#2D6A4F]"
      >
        Cancel
      </Button>
    </div>
  </div>
);

export const AsanteConfirmModal: React.FC<AsanteConfirmModalProps> = ({
  fulfillmentId,
  fulfillerName,
  fulfillerAvatarUrl,
  needTitle,
  open,
  onOpenChange,
  onConfirmed,
}) => {
  const { isMobile } = useMobile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await contributeFulfillmentService.confirm(fulfillmentId);
      setLoading(false);
      onOpenChange(false);
      onConfirmed?.();
    } catch (e) {
      setLoading(false);
      const msg = e instanceof Error ? e.message : 'Could not confirm. Please try again.';
      setError(msg);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    onOpenChange(false);
  };

  const heading = `Give Asante to ${fulfillerName}`;
  const description = 'Recognize this contribution.';

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90dvh] bg-background">
          <DrawerHeader className="text-center">
            <DrawerTitle className="font-serif text-xl text-foreground">{heading}</DrawerTitle>
            <DrawerDescription className="sr-only">{description}</DrawerDescription>
          </DrawerHeader>
          <Body
            fulfillerName={fulfillerName}
            fulfillerAvatarUrl={fulfillerAvatarUrl}
            needTitle={needTitle}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            loading={loading}
            error={error}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-background border-2 border-[#4A8D77]/15">
        <DialogHeader className="px-6 pt-6 pb-2 text-center">
          <DialogTitle className="font-serif text-2xl text-foreground">{heading}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
        </DialogHeader>
        <Body
          fulfillerName={fulfillerName}
          fulfillerAvatarUrl={fulfillerAvatarUrl}
          needTitle={needTitle}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          loading={loading}
          error={error}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AsanteConfirmModal;
