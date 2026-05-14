/**
 * FulfillmentTracker — single-fulfillment deep view.
 * Reachable via /dna/contribute/fulfillment/:fulfillmentId
 *
 * Auth gating: only the requester or fulfiller can view.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  contributeFulfillmentService,
  type FulfillmentWithParties,
  type AcknowledgmentWithGiver,
} from '@/services/contributeFulfillmentService';
import { FulfillmentStatusBadge } from '@/components/contribute/recognition/FulfillmentStatusBadge';
import { AdinkrahenIcon } from '@/components/contribute/recognition/AdinkrahenIcon';
import { AsanteConfirmModal } from '@/components/contribute/recognition/AsanteConfirmModal';

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

function fmtAbs(iso: string | null): string {
  if (!iso) return '';
  try {
    return format(new Date(iso), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return '';
  }
}

function fmtRel(iso: string | null): string {
  if (!iso) return '';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

interface PartyCardProps {
  label: string;
  name: string;
  avatarUrl?: string | null;
  username?: string | null;
}
const PartyCard: React.FC<PartyCardProps> = ({ label, name, avatarUrl, username }) => {
  const inner = (
    <div className="flex items-center gap-3">
      <Avatar className="w-12 h-12">
        <AvatarImage src={avatarUrl || undefined} alt={name} />
        <AvatarFallback className="bg-[#4A8D77] text-white font-semibold">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{name}</p>
      </div>
    </div>
  );
  return (
    <Card className="border border-border">
      <CardContent className="p-4">
        {username ? (
          <Link to={`/dna/${username}`} className="hover:opacity-90">
            {inner}
          </Link>
        ) : (
          inner
        )}
      </CardContent>
    </Card>
  );
};

interface TimelineEntry {
  label: string;
  iso: string | null;
}

export default function FulfillmentTracker() {
  const { fulfillmentId } = useParams<{ fulfillmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [item, setItem] = useState<FulfillmentWithParties | null>(null);
  const [acks, setAcks] = useState<AcknowledgmentWithGiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!fulfillmentId) return;
    try {
      const data = await contributeFulfillmentService.getById(fulfillmentId);
      setItem(data);
      if (data?.status === 'confirmed') {
        const list = await contributeFulfillmentService.listAcknowledgments(fulfillmentId);
        setAcks(list);
      }
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Could not load fulfillment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fulfillmentId, toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auth gate
  useEffect(() => {
    if (loading || !item || !user) return;
    if (user.id !== item.fulfiller_id && user.id !== item.requester_id) {
      toast({ title: 'This fulfillment is private.' });
      navigate('/dna/contribute', { replace: true });
    }
  }, [loading, item, user, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#4A8D77]" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <h1 className="font-serif text-2xl text-foreground mb-2">Fulfillment not found</h1>
        <Button variant="outline" onClick={() => navigate('/dna/contribute')}>
          Back to Contribute
        </Button>
      </div>
    );
  }

  const isRequester = user?.id === item.requester_id;
  const isFulfiller = user?.id === item.fulfiller_id;
  const fulfillerName =
    item.fulfiller?.full_name || item.fulfiller?.username || 'Fulfiller';
  const requesterName =
    item.requester?.full_name || item.requester?.username || 'Requester';

  const timeline: TimelineEntry[] = [
    { label: 'Offered', iso: item.created_at },
    {
      label: 'In progress',
      iso:
        item.status === 'in_progress' ||
        item.status === 'fulfilled' ||
        item.status === 'confirmed'
          ? item.updated_at
          : null,
    },
    { label: 'Marked fulfilled', iso: item.fulfilled_at },
    { label: 'Asante given', iso: item.confirmed_at },
    { label: 'Cancelled', iso: item.cancelled_at },
  ].filter((t) => t.iso);

  const handleAccept = async () => {
    setActing(true);
    try {
      await contributeFulfillmentService.setStatus(item.id, 'in_progress');
      await refresh();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setActing(false);
    }
  };

  const handleMarkFulfilled = async () => {
    setActing(true);
    try {
      await contributeFulfillmentService.setStatus(item.id, 'fulfilled');
      await refresh();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    setActing(true);
    try {
      await contributeFulfillmentService.cancel(item.id);
      await refresh();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
      <Link
        to="/dna/contribute"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-[#2D6A4F] font-medium">
          Fulfillment
        </p>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h1 className="font-serif text-2xl sm:text-3xl text-foreground leading-tight">
            <Link
              to={`/dna/contribute/needs/${item.need_id}`}
              className="hover:text-[#4A8D77]"
            >
              {item.need?.title || 'Untitled need'}
            </Link>
          </h1>
          <FulfillmentStatusBadge status={item.status} />
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PartyCard
          label="Requester"
          name={requesterName}
          avatarUrl={item.requester?.avatar_url}
          username={item.requester?.username}
        />
        <PartyCard
          label="Fulfiller"
          name={fulfillerName}
          avatarUrl={item.fulfiller?.avatar_url}
          username={item.fulfiller?.username}
        />
      </section>

      {item.fulfiller_message && (
        <section>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Offer message
          </p>
          <p className="text-foreground/85 leading-relaxed border-l-2 border-[#4A8D77]/40 pl-3">
            "{item.fulfiller_message}"
          </p>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Timeline</h2>
        <ol className="border-l border-border ml-2 space-y-3 pl-4">
          {timeline.map((t) => (
            <li key={t.label} className="relative">
              <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#4A8D77]" />
              <p className="text-sm text-foreground font-medium">{t.label}</p>
              <p className="text-xs text-muted-foreground">
                {fmtAbs(t.iso)} / {fmtRel(t.iso)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Actions */}
      <section className="flex flex-wrap gap-2 pt-2">
        {isRequester && item.status === 'pending' && (
          <>
            <Button
              onClick={handleAccept}
              disabled={acting}
              className="bg-[#4A8D77] hover:bg-[#3d7864] text-white"
            >
              Accept
            </Button>
            <Button onClick={handleCancel} disabled={acting} variant="ghost">
              Decline
            </Button>
          </>
        )}
        {isRequester && item.status === 'fulfilled' && (
          <Button
            onClick={() => setConfirmOpen(true)}
            className="bg-[#4A8D77] hover:bg-[#3d7864] text-white"
          >
            Confirm Fulfillment
          </Button>
        )}
        {isFulfiller && item.status === 'in_progress' && (
          <Button
            onClick={handleMarkFulfilled}
            disabled={acting}
            className="bg-[#4A8D77] hover:bg-[#3d7864] text-white"
          >
            Mark Fulfilled
          </Button>
        )}
        {isFulfiller &&
          (item.status === 'pending' || item.status === 'fulfilled') && (
            <Button onClick={handleCancel} disabled={acting} variant="ghost">
              Withdraw
            </Button>
          )}
      </section>

      {/* Acknowledgments */}
      {item.status === 'confirmed' && acks.length > 0 && (
        <section className="space-y-3 border-t border-border pt-6">
          <div className="flex items-center gap-2">
            <span className="text-[#4A8D77]">
              <AdinkrahenIcon size={20} />
            </span>
            <h2 className="font-serif text-xl text-foreground">Recognition</h2>
          </div>
          <ul className="space-y-3">
            {acks.map((a) => {
              const giverName =
                a.from_profile?.full_name || a.from_profile?.username || 'A member';
              const direction =
                a.from_profile_id === item.requester_id
                  ? `${requesterName} -> ${fulfillerName}`
                  : `${fulfillerName} -> ${requesterName}`;
              return (
                <li key={a.id} className="border border-border rounded-lg p-4 bg-card">
                  <p className="text-xs uppercase tracking-wider text-[#2D6A4F] mb-1">
                    {direction}
                  </p>
                  <p className="text-foreground leading-relaxed">{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {giverName} / {fmtAbs(a.created_at)}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {confirmOpen && (
        <AsanteConfirmModal
          fulfillmentId={item.id}
          fulfillerName={fulfillerName}
          fulfillerAvatarUrl={item.fulfiller?.avatar_url || undefined}
          needTitle={item.need?.title || 'this need'}
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirmed={refresh}
        />
      )}
    </div>
  );
}
