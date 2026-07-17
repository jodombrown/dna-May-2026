import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, VolumeX, Volume2, AlertCircle, Search, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MutedAuthor {
  id: string;
  muted_user_id: string;
  created_at: string;
  profile: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

type SortMode = 'recent' | 'oldest' | 'name';

const PAGE_SIZE = 20;

const getInitials = (name: string | null | undefined) =>
  (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export default function MutedAuthorsSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<
    | { kind: 'single'; ids: string[]; name: string }
    | { kind: 'bulk'; ids: string[] }
    | null
  >(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['muted-authors', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<MutedAuthor[]> => {
      const { data: rows, error: err } = await supabase
        .from('muted_authors')
        .select('id, muted_user_id, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (err) throw err;
      const ids = (rows || []).map((r) => r.muted_user_id);
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', ids);
      const byId = new Map((profiles || []).map((p) => [p.id, p]));
      return (rows || []).map((r) => ({
        ...r,
        profile: (byId.get(r.muted_user_id) as MutedAuthor['profile']) || null,
      }));
    },
  });

  const unmute = useMutation({
    mutationFn: async (mutedUserIds: string[]) => {
      const { error: err } = await supabase
        .from('muted_authors')
        .delete()
        .eq('user_id', user!.id)
        .in('muted_user_id', mutedUserIds);
      if (err) throw err;
      return mutedUserIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['muted-authors', user?.id] });
      setSelected(new Set());
      toast({
        title: count === 1 ? 'Author unmuted' : `${count} authors unmuted`,
        description: 'Their posts will appear in your feed again.',
      });
    },
    onError: (e: Error) => {
      toast({ title: 'Failed to unmute', description: e.message, variant: 'destructive' });
    },
  });

  const rows = data || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = list.filter((r) => {
        const name = (r.profile?.full_name || '').toLowerCase();
        const uname = (r.profile?.username || '').toLowerCase();
        return name.includes(q) || uname.includes(q);
      });
    }
    const sorted = [...list];
    if (sort === 'recent') {
      sorted.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    } else if (sort === 'oldest') {
      sorted.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    } else {
      sorted.sort((a, b) =>
        (a.profile?.full_name || a.profile?.username || '').localeCompare(
          b.profile?.full_name || b.profile?.username || ''
        )
      );
    }
    return sorted;
  }, [rows, search, sort]);

  const visible = filtered.slice(0, visibleCount);
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.muted_user_id));

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visible.forEach((r) => next.delete(r.muted_user_id));
      } else {
        visible.forEach((r) => next.add(r.muted_user_id));
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <SettingsLayout title="Muted authors" description="Creators you've muted from your feed">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SettingsLayout>
    );
  }

  if (error) {
    return (
      <SettingsLayout title="Muted authors" description="Creators you've muted from your feed">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4 text-destructive" />
              <p>Failed to load muted authors</p>
            </div>
          </CardContent>
        </Card>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Muted authors" description="Creators you've muted from your feed">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <VolumeX className="h-5 w-5" />
              About muting
            </CardTitle>
            <CardDescription>What happens when you mute an author</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-body text-muted-foreground space-y-2">
              <li>Their posts stop appearing in your feed.</li>
              <li>You stay connected - they aren't blocked or notified.</li>
              <li>You can still view their profile and messages.</li>
              <li>Unmute any time to bring their posts back.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Muted authors ({rows.length})</CardTitle>
            <CardDescription>Unmute to see their posts in your feed again</CardDescription>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="py-12 text-center">
                <Volume2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">You haven't muted anyone</p>
                <p className="text-body text-muted-foreground mt-1">
                  Mute an author from any post to hide their content from your feed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search + Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setVisibleCount(PAGE_SIZE);
                      }}
                      placeholder="Search by name or username"
                      className="pl-9 pr-9"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
                    <SelectTrigger className="sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recently muted</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bulk action bar */}
                <div className="flex items-center justify-between gap-3 py-2 border-y">
                  <label className="flex items-center gap-2 text-body cursor-pointer">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleAllVisible}
                      aria-label="Select all visible"
                    />
                    <span className="text-muted-foreground">
                      {selected.size > 0
                        ? `${selected.size} selected`
                        : `Select all (${visible.length})`}
                    </span>
                  </label>
                  {selected.size > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelected(new Set())}
                      >
                        Clear
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setConfirm({ kind: 'bulk', ids: Array.from(selected) })
                        }
                        disabled={unmute.isPending}
                      >
                        Unmute {selected.size}
                      </Button>
                    </div>
                  )}
                </div>

                {filtered.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    No authors match "{search}"
                  </div>
                ) : (
                  <>
                    <div className="divide-y">
                      {visible.map((r) => {
                        const checked = selected.has(r.muted_user_id);
                        const displayName = r.profile?.full_name || 'Unknown user';
                        return (
                          <div
                            key={r.id}
                            className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleOne(r.muted_user_id)}
                              aria-label={`Select ${displayName}`}
                            />
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={r.profile?.avatar_url || undefined} alt="" />
                                <AvatarFallback>{getInitials(r.profile?.full_name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{displayName}</p>
                                {r.profile?.username && (
                                  <p className="text-body text-muted-foreground truncate">
                                    @{r.profile.username}
                                  </p>
                                )}
                                <p className="text-caption text-muted-foreground mt-0.5">
                                  Muted {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setConfirm({
                                  kind: 'single',
                                  ids: [r.muted_user_id],
                                  name: displayName,
                                })
                              }
                              disabled={unmute.isPending}
                            >
                              Unmute
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    {visibleCount < filtered.length && (
                      <div className="flex justify-center pt-2">
                        <Button
                          variant="ghost"
                          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                        >
                          Show more ({filtered.length - visibleCount} remaining)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === 'bulk'
                ? `Unmute ${confirm.ids.length} authors?`
                : `Unmute ${confirm?.kind === 'single' ? confirm.name : ''}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === 'bulk'
                ? 'Their posts will start appearing in your feed again. You can mute them anytime.'
                : 'Their posts will start appearing in your feed again. You can mute them anytime.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm) {
                  unmute.mutate(confirm.ids);
                  setConfirm(null);
                }
              }}
            >
              Unmute
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsLayout>
  );
}
