/**
 * ProfileAsanteSection — surfaces public Asante received on a profile.
 * Hidden entirely when the member has none.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  contributeFulfillmentService,
  type AcknowledgmentWithGiver,
} from '@/services/contributeFulfillmentService';
import { AdinkrahenIcon } from '@/components/contribute/recognition/AdinkrahenIcon';
import { useMobile } from '@/hooks/useMobile';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProfileAsanteSectionProps {
  profileId: string;
}

function timeAgo(iso: string): string {
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

const Row: React.FC<{ ack: AcknowledgmentWithGiver }> = ({ ack }) => {
  const giver = ack.from_profile;
  const name = giver?.full_name || giver?.username || 'A member';
  const link = giver?.username ? `/dna/${giver.username}` : '#';
  return (
    <li className="flex items-start gap-3 py-3 border-b border-border last:border-b-0">
      <Avatar className="w-9 h-9 shrink-0">
        <AvatarImage src={giver?.avatar_url || undefined} alt={name} />
        <AvatarFallback className="bg-[#4A8D77] text-white text-xs font-semibold">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <Link to={link} className="text-sm font-medium text-foreground hover:text-[#4A8D77]">
          {name}
        </Link>
        <p className="text-sm text-foreground/80 leading-relaxed">{ack.message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(ack.created_at)}</p>
      </div>
    </li>
  );
};

export const ProfileAsanteSection: React.FC<ProfileAsanteSectionProps> = ({ profileId }) => {
  const [items, setItems] = useState<AcknowledgmentWithGiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { isMobile } = useMobile();

  useEffect(() => {
    let cancelled = false;
    contributeFulfillmentService
      .listAsanteForProfile(profileId, 50)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  if (loading) return null;
  if (items.length === 0) return null;

  const preview = items.slice(0, 5);
  const hasMore = items.length > 5;

  const fullList = (
    <ul className="divide-y divide-border">
      {items.map((a) => (
        <Row key={a.id} ack={a} />
      ))}
    </ul>
  );

  return (
    <Card className="border border-border">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-[#4A8D77]" aria-hidden="true">
              <AdinkrahenIcon size={28} strokeWidth={1.5} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Asante received
              </p>
              <p className="font-serif text-2xl text-[#4A8D77] leading-none">
                {items.length}
              </p>
            </div>
          </div>
        </div>

        <ul>
          {preview.map((a) => (
            <Row key={a.id} ack={a} />
          ))}
        </ul>

        {hasMore && (
          <div className="pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(true)}
              className="text-[#2D6A4F]"
            >
              View all {items.length}
            </Button>
          </div>
        )}

        {isMobile ? (
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent className="max-h-[85dvh]">
              <DrawerHeader>
                <DrawerTitle className="font-serif">All Asante received</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-6 overflow-y-auto">{fullList}</div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="font-serif">All Asante received</DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">{fullList}</div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileAsanteSection;
