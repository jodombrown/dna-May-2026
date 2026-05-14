import React, { useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { safetyService, type ReportReason } from '@/services/safetyService';
import { cn } from '@/lib/utils';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
  conversationId?: string;
  messageId?: string;
}

const REASONS: { id: ReportReason; label: string }[] = [
  { id: 'spam', label: 'Spam' },
  { id: 'harassment', label: 'Harassment' },
  { id: 'impersonation', label: 'Impersonation' },
  { id: 'inappropriate_content', label: 'Inappropriate content' },
  { id: 'other', label: 'Other' },
];

export const ReportDialog: React.FC<ReportDialogProps> = ({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
  conversationId,
  messageId,
}) => {
  const { toast } = useToast();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setBusy(true);
    try {
      await safetyService.reportUser({
        targetUserId,
        reason,
        details: details.trim() || undefined,
        conversationId,
        messageId,
      });
      // Phase 11 - flag the conversation so the in-thread banner can surface
      // a status notice (and act as the "undo / dismiss" affordance).
      if (conversationId) {
        try {
          sessionStorage.setItem(`dna:recent-report:${conversationId}`, String(Date.now()));
        } catch { /* ignore */ }
      }
      toast({
        title: 'Report submitted',
        description: 'Thank you. Our team will review it.',
      });
      setReason(null);
      setDetails('');
      onOpenChange(false);
    } catch (e) {
      toast({
        title: 'Failed to submit report',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-md">
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>Report {targetUserName}</ResponsiveModalTitle>
        <ResponsiveModalDescription>
          Tell us what is wrong. Reports are confidential.
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <div className="px-4 pb-2 space-y-3">
        <div className="grid grid-cols-1 gap-1.5">
          {REASONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setReason(r.id)}
              className={cn(
                'text-left px-3 py-2 rounded-md border text-sm transition-colors',
                reason === r.id
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <Textarea
          placeholder="Add details (optional)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          maxLength={1000}
          className="resize-none"
        />
      </div>

      <ResponsiveModalFooter className="gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!reason || busy}>
          {busy ? 'Submitting...' : 'Submit report'}
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
};
