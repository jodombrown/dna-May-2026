/**
 * DiscardDraftConfirmation — destructive confirmation surface.
 * Drawer on mobile (<768px), Dialog on desktop. Esc cancels.
 *
 * Per PRD §3.3.
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/useMobile';
import type { ComposerMode } from '@/hooks/useUniversalComposer';
import type { DiscardSource } from '@/lib/composerAnalytics';

export interface DiscardConfirmationProps {
  open: boolean;
  mode: ComposerMode;
  source: DiscardSource;
  onConfirm: () => void;
  onCancel: () => void;
}

const TITLE = 'Discard this draft?';
const BODY = "Your unsaved changes can't be recovered.";

export const DiscardDraftConfirmation = ({
  open,
  onConfirm,
  onCancel,
}: DiscardConfirmationProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{TITLE}</DrawerTitle>
            <DrawerDescription>{BODY}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="flex flex-col gap-2 pt-2">
            <Button
              onClick={onConfirm}
              className="w-full bg-dna-copper text-white hover:bg-dna-copper-dark"
            >
              Discard draft
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full" onClick={onCancel}>
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{TITLE}</DialogTitle>
          <DialogDescription>{BODY}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-dna-copper text-white hover:bg-dna-copper-dark"
          >
            Discard draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
