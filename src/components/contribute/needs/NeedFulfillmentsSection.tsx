/**
 * NeedFulfillmentsSection — shown on NeedDetail to the requester.
 * Displays all fulfillment offers and the actions appropriate per status.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  contributeFulfillmentService,
  type FulfillmentWithParties,
} from '@/services/contributeFulfillmentService';
import { AsanteConfirmModal } from '@/components/contribute/recognition/AsanteConfirmModal';
import { FulfillmentStatusBadge } from '@/components/contribute/recognition/FulfillmentStatusBadge';
import { AdinkrahenIcon } from '@/components/contribute/recognition/AdinkrahenIcon';

interface NeedFulfillmentsSectionProps {
  needId: string;
  needTitle: string;
  isRequester: boolean;
}

function initials(name?: string | null): string {
  if (!name) return 'DN';
  return (
    name
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'DN'
  );
}

function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

export const NeedFulfillmentsSection: React.FC<NeedFulfillmentsSectionProps> = ({
  needId,
  needTitle,
  isRequester,
}) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<FulfillmentWithParties[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<FulfillmentWithParties | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await contributeFulfillmentService.listForNeed(needId);
      setRows(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load fulfillments';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [needId, toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAccept = async (id: string) => {
    setActingId(id);
    try {
      await contributeFulfillmentService.setStatus(id, 'in_progress');
      await refresh();
    } catch (e) {
      toast({
        title: 'Could not accept',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setActingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActingId(id);
    try {
      await contributeFulfillmentService.cancel(id);
      await refresh();
    } catch (e) {
      toast({
        title: 'Could not decline',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setActingId(null);
    }
  };

  if (!isRequester) return null;
  if (loading) {
    return (
      <section className="py-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading fulfillments...
      </section>
    );
  }
  if (rows.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl text-foreground">Fulfillments</h2>

      <ul className="space-y-3">
        {rows.map((r) => {
          const name = r.fulfiller?.full_name || r.fulfiller?.username || 'A member';
          const isCancelled = r.status === 'cancelled';
          return (
            <li
              key={r.id}
              className={`border border-border rounded-lg bg-card p-4 ${isCancelled ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-11 h-11 shrink-0">
                  <AvatarImage src={r.fulfiller?.avatar_url || undefined} alt={name} />
                  <AvatarFallback className="bg-[#4A8D77] text-white text-sm font-semibold">
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground">{name}</p>
                    <FulfillmentStatusBadge status={r.status} />
                    {r.status === 'confirmed' && (
                      <span className="text-[#4A8D77]" aria-label="Asante given">
                        <AdinkrahenIcon size={16} strokeWidth={1.5} />
                      </span>
                    )}
                  </div>

                  {r.status === 'pending' && r.fulfiller_message && (
                    <p className="mt-1.5 text-sm text-foreground/80 leading-relaxed">
                      "{r.fulfiller_message}"
                    </p>
                  )}

                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {r.status === 'pending' && `Offered ${timeAgo(r.created_at)}`}
                    {r.status === 'in_progress' &&
                      `${name} is working on this since ${timeAgo(r.updated_at)}`}
                    {r.status === 'fulfilled' &&
                      `Marked fulfilled ${timeAgo(r.fulfilled_at)}`}
                    {r.status === 'confirmed' && `Asante given ${timeAgo(r.confirmed_at)}`}
                    {r.status === 'cancelled' && `Cancelled ${timeAgo(r.cancelled_at)}`}
                  </p>

                  {/* Actions */}
                  {r.status === 'pending' && (
                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(r.id)}
                        disabled={actingId === r.id}
                        className="bg-[#4A8D77] hover:bg-[#3d7864] text-white"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDecline(r.id)}
                        disabled={actingId === r.id}
                        className="text-muted-foreground"
                      >
                        Decline
                      </Button>
                    </div>
                  )}

                  {r.status === 'fulfilled' && (
                    <div className="mt-3">
                      <Button
                        size="sm"
                        onClick={() => setConfirmTarget(r)}
                        className="bg-[#4A8D77] hover:bg-[#3d7864] text-white w-full sm:w-auto"
                      >
                        Confirm Fulfillment
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {confirmTarget && (
        <AsanteConfirmModal
          fulfillmentId={confirmTarget.id}
          fulfillerName={
            confirmTarget.fulfiller?.full_name ||
            confirmTarget.fulfiller?.username ||
            'this member'
          }
          fulfillerAvatarUrl={confirmTarget.fulfiller?.avatar_url || undefined}
          needTitle={needTitle}
          open={!!confirmTarget}
          onOpenChange={(o) => {
            if (!o) setConfirmTarget(null);
          }}
          onConfirmed={() => {
            setConfirmTarget(null);
            refresh();
          }}
        />
      )}
    </section>
  );
};

export default NeedFulfillmentsSection;
