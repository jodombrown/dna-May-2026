/**
 * MyOffersSection — fulfiller's view of their outstanding offers.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  contributeFulfillmentService,
  type FulfillmentWithParties,
  type FulfillmentStatus,
} from '@/services/contributeFulfillmentService';
import { FulfillmentStatusBadge } from '@/components/contribute/recognition/FulfillmentStatusBadge';
import { AdinkrahenIcon } from '@/components/contribute/recognition/AdinkrahenIcon';

const ACTIVE: FulfillmentStatus[] = ['pending', 'in_progress', 'fulfilled'];

function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
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

export const MyOffersSection: React.FC = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<FulfillmentWithParties[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [confirmingFulfillId, setConfirmingFulfillId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await contributeFulfillmentService.listMyOffers();
      const sorted = [...data].sort((a, b) => {
        const aActive = ACTIVE.includes(a.status) ? 0 : 1;
        const bActive = ACTIVE.includes(b.status) ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setRows(sorted);
    } catch (e) {
      toast({
        title: 'Could not load offers',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleWithdraw = async (id: string) => {
    setActingId(id);
    try {
      await contributeFulfillmentService.cancel(id);
      await refresh();
    } catch (e) {
      toast({
        title: 'Could not withdraw',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setActingId(null);
    }
  };

  const handleMarkFulfilled = async (id: string) => {
    setActingId(id);
    try {
      await contributeFulfillmentService.setStatus(id, 'fulfilled');
      setConfirmingFulfillId(null);
      await refresh();
    } catch (e) {
      toast({
        title: 'Could not update',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setActingId(null);
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl text-foreground">My Offers</h2>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading...
        </div>
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-6 text-sm text-muted-foreground">
          You haven't offered to fulfill any needs yet. Open the Room to find matches where
          you can contribute.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const requesterName =
              r.requester?.full_name || r.requester?.username || 'A member';
            const isCancelled = r.status === 'cancelled';
            return (
              <li
                key={r.id}
                className={`border border-border rounded-lg bg-card p-4 ${isCancelled ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage
                      src={r.requester?.avatar_url || undefined}
                      alt={requesterName}
                    />
                    <AvatarFallback className="bg-[#2D6A4F] text-white text-sm font-semibold">
                      {initials(requesterName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/dna/contribute/needs/${r.need_id}`}
                        className="font-medium text-foreground hover:text-[#4A8D77]"
                      >
                        {r.need?.title || 'Untitled need'}
                      </Link>
                      <FulfillmentStatusBadge status={r.status} />
                      {r.status === 'confirmed' && (
                        <span className="text-[#4A8D77]" aria-label="Asante received">
                          <AdinkrahenIcon size={16} strokeWidth={1.5} />
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      For <span className="text-foreground">{requesterName}</span>
                      {r.status === 'pending' && ' / Awaiting acceptance'}
                      {r.status === 'in_progress' && ` / Active since ${timeAgo(r.updated_at)}`}
                      {r.status === 'fulfilled' &&
                        ` / Awaiting ${requesterName}'s confirmation`}
                      {r.status === 'confirmed' &&
                        ` / Asante received ${timeAgo(r.confirmed_at)}`}
                      {r.status === 'cancelled' && ` / Cancelled ${timeAgo(r.cancelled_at)}`}
                    </p>

                    {/* Actions */}
                    {(r.status === 'pending' || r.status === 'fulfilled') && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleWithdraw(r.id)}
                          disabled={actingId === r.id}
                          className="text-muted-foreground"
                        >
                          Withdraw
                        </Button>
                      </div>
                    )}

                    {r.status === 'in_progress' && (
                      <div className="mt-3">
                        {confirmingFulfillId === r.id ? (
                          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                            <span className="text-sm text-foreground">Mark this fulfilled?</span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleMarkFulfilled(r.id)}
                                disabled={actingId === r.id}
                                className="bg-[#4A8D77] hover:bg-[#3d7864] text-white"
                              >
                                Yes, mark fulfilled
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmingFulfillId(null)}
                                disabled={actingId === r.id}
                              >
                                Not yet
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setConfirmingFulfillId(r.id)}
                            className="bg-[#4A8D77] hover:bg-[#3d7864] text-white"
                          >
                            Mark Fulfilled
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default MyOffersSection;
