/**
 * The Proof Sheet (BD086)
 *
 * Every proof block is a door, never a dead end. A number that persuades must
 * open the people behind it.
 *
 * One component, five uses. Cards stay dumb: they pass a `kind` and an
 * `entityId` and render nothing about people themselves.
 *
 *   attendees          → who is going to an event (+ maybe / waitlist)
 *   space_members      → who is in a Space, and what role they hold
 *   resharers          → who reshared a post
 *   mutual_connections → who we both know
 *   reactors           → who reacted  ⚠ DARK until BD082 (no reaction store yet)
 *
 * NETWORK-FIRST, THEN EVERYONE. The whole point of the tap is recognition: you
 * see a name you know and *that* is the moment you act. People you're connected
 * to are surfaced above the rest, always.
 *
 * A sheet, not a navigation — the member stays in the feed, where the flywheel is.
 */

import React, { useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSpaceRoster } from '@/hooks/collaborate/useSpaceRoster';
import { cn } from '@/lib/utils';

export type ProofSheetKind =
  | 'attendees'
  | 'space_members'
  | 'resharers'
  | 'mutual_connections'
  | 'reactors';

export interface ProofPerson {
  user_id: string;
  name: string;
  username?: string | null;
  avatar_url?: string | null;
  /** Space role, or RSVP status — the meaningful qualifier for this kind. */
  qualifier?: string | null;
  /** Is this person in my network? Drives the network-first sort. */
  inNetwork?: boolean;
}

interface ProofSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: ProofSheetKind;
  entityId: string | null | undefined;
  /** Optional override, e.g. "Going to African Tech Summit". */
  title?: string;
}

const SHEET_COPY: Record<ProofSheetKind, { title: string; empty: string }> = {
  attendees: { title: 'Who’s going', empty: 'No one has RSVP’d yet. Be the first.' },
  space_members: { title: 'Who’s in this Space', empty: 'This Space has no members yet.' },
  resharers: { title: 'Who reshared', empty: 'No reshares yet.' },
  mutual_connections: { title: 'People you both know', empty: 'No mutual connections yet.' },
  reactors: { title: 'Who reacted', empty: 'No reactions yet.' },
};

/** RSVP statuses worth surfacing, in the order people care about. */
const RSVP_ORDER: Record<string, number> = { going: 0, maybe: 1, waitlist: 2, pending: 3 };
const RSVP_LABEL: Record<string, string> = {
  going: 'Going',
  maybe: 'Maybe',
  waitlist: 'Waitlist',
  pending: 'Pending',
};

const nameOf = (p: {
  full_name?: string | null;
  display_name?: string | null;
  username?: string | null;
}) => p.full_name || p.display_name || p.username || 'Member';

/** My accepted connections — the spine of network-first ordering. */
function useMyConnections() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-connection-ids', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Set<string>> => {
      const { data } = await supabase
        .from('connections')
        .select('requester_id, recipient_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user!.id},recipient_id.eq.${user!.id}`);

      const ids = new Set<string>();
      (data ?? []).forEach((c: { requester_id: string; recipient_id: string }) => {
        ids.add(c.requester_id === user!.id ? c.recipient_id : c.requester_id);
      });
      return ids;
    },
  });
}

function useProofPeople(kind: ProofSheetKind, entityId: string | null | undefined, open: boolean) {
  const { user } = useAuth();
  const enabled = open && !!entityId;

  const { data: connectionIds = new Set<string>() } = useMyConnections();
  const roster = useSpaceRoster(kind === 'space_members' && open ? entityId ?? undefined : undefined);

  const remote = useQuery({
    queryKey: ['proof-sheet', kind, entityId, user?.id],
    enabled: enabled && kind !== 'space_members',
    queryFn: async (): Promise<ProofPerson[]> => {
      // ---- attendees -------------------------------------------------------
      if (kind === 'attendees') {
        const { data: rows } = await supabase
          .from('event_attendees')
          .select('user_id, status')
          .eq('event_id', entityId!)
          .in('status', ['going', 'maybe', 'waitlist']);

        if (!rows?.length) return [];
        const profiles = await fetchProfiles(rows.map((r) => r.user_id));
        return rows.map((r) => {
          const p = profiles.get(r.user_id);
          return {
            user_id: r.user_id,
            name: p ? nameOf(p) : 'Member',
            username: p?.username ?? null,
            avatar_url: p?.avatar_url ?? null,
            qualifier: RSVP_LABEL[r.status] ?? r.status,
          };
        });
      }

      // ---- resharers -------------------------------------------------------
      if (kind === 'resharers') {
        const { data: rows } = await supabase
          .from('posts')
          .select('author_id')
          .eq('original_post_id', entityId!);

        if (!rows?.length) return [];
        const ids = [...new Set(rows.map((r) => r.author_id))];
        const profiles = await fetchProfiles(ids);
        return ids.map((id) => {
          const p = profiles.get(id);
          return {
            user_id: id,
            name: p ? nameOf(p) : 'Member',
            username: p?.username ?? null,
            avatar_url: p?.avatar_url ?? null,
          };
        });
      }

      // ---- mutual_connections ---------------------------------------------
      // entityId is the *other person*. The live RPC is authoritative — it
      // owns the accepted-connections intersection. ⚠ get_mutual_connections
      // has a second overload (p_viewer_id/p_target_user_id/p_limit); named
      // args make PostgREST resolve this one.
      if (kind === 'mutual_connections') {
        if (!user?.id) return [];
        const { data, error } = await supabase.rpc('get_mutual_connections', {
          user1_id: user.id,
          user2_id: entityId!,
        });
        if (error || !data) return [];
        return data.map((p) => ({
          user_id: p.id,
          name: p.full_name || p.username || 'Member',
          username: p.username,
          avatar_url: p.avatar_url,
          qualifier: p.headline ?? null,
        }));
      }

      // ---- reactors — BD082 ------------------------------------------------
      // There is no reaction write path yet, so post_reactions is empty by
      // definition. Returning [] is the honest answer; when BD082 lands, this
      // becomes a real query and nothing else changes.
      return [];
    },
  });

  const people: ProofPerson[] = useMemo(() => {
    const base: ProofPerson[] =
      kind === 'space_members'
        ? (roster.data ?? []).map((m) => ({
            user_id: m.user_id,
            name: nameOf(m),
            username: m.username ?? null,
            avatar_url: m.avatar_url ?? null,
            qualifier: m.role,
          }))
        : (remote.data ?? []);

    // NETWORK-FIRST, THEN EVERYONE.
    return base
      .map((p) => ({ ...p, inNetwork: connectionIds.has(p.user_id) }))
      .sort((a, b) => {
        if (a.inNetwork !== b.inNetwork) return a.inNetwork ? -1 : 1;
        if (kind === 'attendees') {
          const ra = RSVP_ORDER[(a.qualifier ?? '').toLowerCase()] ?? 9;
          const rb = RSVP_ORDER[(b.qualifier ?? '').toLowerCase()] ?? 9;
          if (ra !== rb) return ra - rb;
        }
        return a.name.localeCompare(b.name);
      });
  }, [kind, roster.data, remote.data, connectionIds]);

  const isLoading = kind === 'space_members' ? roster.isLoading : remote.isLoading;
  return { people, isLoading };
}

async function fetchProfiles(ids: string[]) {
  const map = new Map<
    string,
    {
      full_name: string | null;
      display_name: string | null;
      username: string | null;
      avatar_url: string | null;
    }
  >();
  if (!ids.length) return map;

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, username, avatar_url')
    .in('id', ids);

  (data ?? []).forEach((p: { id: string } & Record<string, string | null>) => {
    map.set(p.id, {
      full_name: p.full_name ?? null,
      display_name: p.display_name ?? null,
      username: p.username ?? null,
      avatar_url: p.avatar_url ?? null,
    });
  });
  return map;
}

export const ProofSheet: React.FC<ProofSheetProps> = ({
  open,
  onOpenChange,
  kind,
  entityId,
  title,
}) => {
  const navigate = useNavigate();
  const { people, isLoading } = useProofPeople(kind, entityId, open);

  const copy = SHEET_COPY[kind];
  const networkCount = people.filter((p) => p.inNetwork).length;

  const go = (p: ProofPerson) => {
    onOpenChange(false);
    if (p.username) navigate(`/dna/${p.username}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>{title ?? copy.title}</SheetTitle>
          {!isLoading && people.length > 0 && (
            <SheetDescription>
              {networkCount > 0 ? (
                <>
                  <span className="font-semibold text-foreground">
                    {networkCount} in your network
                  </span>
                  {people.length > networkCount && ` · ${people.length} total`}
                </>
              ) : (
                `${people.length} ${people.length === 1 ? 'person' : 'people'}`
              )}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="mt-4 space-y-1 pb-6">
          {isLoading && (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </>
          )}

          {!isLoading && people.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">{copy.empty}</p>
          )}

          {!isLoading &&
            people.map((p, idx) => {
              const isFirstOutsideNetwork =
                networkCount > 0 && idx === networkCount && people[idx]?.inNetwork === false;

              return (
                <React.Fragment key={p.user_id}>
                  {isFirstOutsideNetwork && (
                    <p className="px-1 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Everyone else
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => go(p)}
                    className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left transition-colors hover:bg-muted/60"
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={p.avatar_url || ''} />
                      <AvatarFallback>{p.name[0]?.toUpperCase() ?? 'M'}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      {p.username && (
                        <p className="truncate text-xs text-muted-foreground">@{p.username}</p>
                      )}
                    </div>

                    {p.qualifier && (
                      <Badge variant="secondary" className="flex-shrink-0 text-[11px] capitalize">
                        {p.qualifier}
                      </Badge>
                    )}

                    {p.inNetwork && (
                      <span
                        className={cn(
                          'flex-shrink-0 text-[11px] font-medium text-muted-foreground',
                          p.qualifier && 'ml-1'
                        )}
                      >
                        In your network
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
