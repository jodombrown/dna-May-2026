import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { Loader2, VolumeX, Volume2, AlertCircle } from 'lucide-react';
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
    mutationFn: async (mutedUserId: string) => {
      const { error: err } = await supabase
        .from('muted_authors')
        .delete()
        .eq('user_id', user!.id)
        .eq('muted_user_id', mutedUserId);
      if (err) throw err;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muted-authors', user?.id] });
      toast({ title: 'Author unmuted', description: 'Their posts will appear in your feed again.' });
    },
    onError: (e: Error) => {
      toast({ title: 'Failed to unmute', description: e.message, variant: 'destructive' });
    },
  });

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

  const rows = data || [];

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
              <div className="divide-y">
                {rows.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={r.profile?.avatar_url || undefined} alt="" />
                        <AvatarFallback>{getInitials(r.profile?.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {r.profile?.full_name || 'Unknown user'}
                        </p>
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
                      onClick={() => unmute.mutate(r.muted_user_id)}
                      disabled={unmute.isPending}
                    >
                      {unmute.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unmute'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
}
