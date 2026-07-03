import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RosterMember {
  user_id: string;
  role: string;
  status: string;
  full_name: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export function memberName(m: RosterMember): string {
  return m.full_name || m.display_name || m.username || 'Member';
}

export function memberInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

/**
 * Space roster with profile details. RLS scopes reads to members of the
 * space, so a non-member gets an empty roster — callers use that to gate
 * member-only surfaces (e.g. the task board).
 */
export function useSpaceRoster(spaceId: string | undefined) {
  return useQuery({
    queryKey: ['space-members', spaceId],
    queryFn: async (): Promise<RosterMember[]> => {
      const { data: memberRows, error } = await supabase
        .from('space_members')
        .select('user_id, role, status')
        .eq('space_id', spaceId!);
      if (error) throw error;
      if (!memberRows || memberRows.length === 0) return [];

      const ids = memberRows.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, username, avatar_url')
        .in('id', ids);
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      return memberRows.map((r) => {
        const p = profileMap.get(r.user_id);
        return {
          user_id: r.user_id,
          role: r.role,
          status: r.status ?? 'active',
          full_name: p?.full_name ?? null,
          display_name: p?.display_name ?? null,
          username: p?.username ?? null,
          avatar_url: p?.avatar_url ?? null,
        };
      });
    },
    enabled: !!spaceId,
  });
}
