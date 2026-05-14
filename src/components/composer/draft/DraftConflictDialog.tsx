/**
 * DraftConflictDialog
 *
 * Shown when the same composer draft (user + mode key in localStorage)
 * is updated in another browser tab while a local draft is in progress.
 * The user picks which version to keep.
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
import { formatRelative } from '@/hooks/composer/useDraftStatus';

export interface DraftConflictDialogProps {
  open: boolean;
  thisTabSavedAt: number | null;
  otherTabSavedAt: number | null;
  thisTabPreview: string;
  otherTabPreview: string;
  onKeepThisTab: () => void;
  onUseOtherTab: () => void;
}

export const DraftConflictDialog = ({
  open,
  thisTabSavedAt,
  otherTabSavedAt,
  thisTabPreview,
  otherTabPreview,
  onKeepThisTab,
  onUseOtherTab,
}: DraftConflictDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={() => { /* require explicit choice */ }}>
      <DialogContent className="max-w-[480px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Draft updated in another tab</DialogTitle>
          <DialogDescription>
            We found a newer version of this draft saved from another browser tab.
            Choose which one to keep.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 py-2">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-medium text-dna-forest mb-1">
              This tab {thisTabSavedAt ? `• ${formatRelative(thisTabSavedAt)}` : ''}
            </p>
            <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap">
              {thisTabPreview || <span className="italic text-muted-foreground">empty</span>}
            </p>
          </div>
          <div className="rounded-lg border border-dna-emerald/40 bg-dna-emerald/5 p-3">
            <p className="text-xs font-medium text-dna-emerald mb-1">
              Other tab {otherTabSavedAt ? `• ${formatRelative(otherTabSavedAt)}` : ''}
            </p>
            <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap">
              {otherTabPreview || <span className="italic text-muted-foreground">empty</span>}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onKeepThisTab}>
            Keep this tab
          </Button>
          <Button
            onClick={onUseOtherTab}
            className="bg-dna-emerald text-white hover:bg-dna-emerald/90"
          >
            Use other tab
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
