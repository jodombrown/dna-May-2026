import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface PulseEvent {
  id: string;
  title: string;
  startsAt: string;
  href: string;
}

export interface PulseTask {
  id: string;
  title: string;
  spaceId: string;
  spaceTitle: string;
  dueDate: string | null;
  status: string;
  isStalled: boolean;
  isOverdue: boolean;
  href: string;
}

export interface PulseNeed {
  id: string;
  title: string;
  spaceId: string;
  spaceTitle: string;
  type: string;
  priority: string;
  href: string;
}

export interface DailyPulsePayload {
  events: PulseEvent[];
  tasks: PulseTask[];
  needs: PulseNeed[];
  totals: {
    eventsToday: number;
    tasksDueSoon: number;
    tasksStalled: number;
    openNeeds: number;
  };
}

const TASK_STALLED_DAYS = 7;

/**
 * Phase 18 - Daily Pulse aggregator.
 * Pulls cross-module signal (Convene + Collaborate + Contribute) for the
 * signed-in user so DIA can narrate one consolidated daily brief.
 *
 * All queries are user-scoped or filtered to membership for performance.
 */
export function useDailyPulse(enabled: boolean) {
  const { user } = useAuth();

  return useQuery<DailyPulsePayload>({
    queryKey: ['daily-pulse', user?.id],
    enabled: enabled && !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async () => {
      const uid = user!.id;
      const now = new Date();
      const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
      const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const stalledCutoff = new Date(
        now.getTime() - TASK_STALLED_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();

      // 1. Upcoming events the user has RSVPd to in the next 48h
      const eventsRes = await supabase
        .from('event_attendees')
        .select('event_id, status, events:events!inner(id, title, start_time)')
        .eq('user_id', uid)
        .in('status', ['going', 'maybe'])
        .gte('events.start_time', now.toISOString())
        .lte('events.start_time', in48h)
        .order('events(start_time)', { ascending: true })
        .limit(5);

      const eventsRaw =
        (eventsRes.data ?? []) as Array<{
          event_id: string;
          events: { id: string; title: string; start_time: string } | null;
        }>;

      const events: PulseEvent[] = eventsRaw
        .filter((e) => e.events)
        .map((e) => ({
          id: e.events!.id,
          title: e.events!.title,
          startsAt: e.events!.start_time,
          href: `/dna/convene/events/${e.events!.id}`,
        }));

      // 2. Tasks assigned to me that are due soon or stalled
      const tasksRes = await supabase
        .from('space_tasks')
        .select('id, title, space_id, status, due_date, updated_at, spaces:spaces(id, name)')
        .or(`assignee_id.eq.${uid},assigned_to.eq.${uid}`)
        .neq('status', 'done')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(20);

      const tasksRaw =
        (tasksRes.data ?? []) as Array<{
          id: string;
          title: string;
          space_id: string;
          status: string;
          due_date: string | null;
          updated_at: string;
          spaces: { id: string; name: string } | null;
        }>;

      const tasks: PulseTask[] = tasksRaw
        .map((t) => {
          const due = t.due_date ? new Date(t.due_date) : null;
          const isOverdue = !!due && due.getTime() < now.getTime();
          const isStalled =
            !due && new Date(t.updated_at).toISOString() < stalledCutoff;
          const isDueSoon =
            !!due && due.getTime() >= now.getTime() && t.due_date! <= in7d;
          return {
            id: t.id,
            title: t.title,
            spaceId: t.space_id,
            spaceTitle: t.spaces?.name || 'Untitled space',
            dueDate: t.due_date,
            status: t.status,
            isStalled,
            isOverdue,
            href: `/dna/collaborate/spaces/${t.space_id}?task=${t.id}`,
            _surface: isOverdue || isDueSoon || isStalled,
          };
        })
        .filter((t) => t._surface)
        .slice(0, 5)
        .map(({ _surface, ...rest }) => rest);

      // 3. Open contribution needs in spaces I belong to
      const memberSpacesRes = await supabase
        .from('collaboration_memberships')
        .select('space_id')
        .eq('user_id', uid)
        .eq('status', 'approved')
        .limit(50);

      const spaceIds = (memberSpacesRes.data ?? [])
        .map((m: { space_id: string }) => m.space_id)
        .filter(Boolean);

      let needs: PulseNeed[] = [];
      if (spaceIds.length > 0) {
        const needsRes = await supabase
          .from('contribution_needs')
          .select('id, title, space_id, type, priority, status, created_at, spaces:spaces(id, name)')
          .in('space_id', spaceIds)
          .eq('status', 'open')
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(5);

        const needsRaw =
          (needsRes.data ?? []) as Array<{
            id: string;
            title: string;
            space_id: string;
            type: string;
            priority: string;
            spaces: { id: string; name: string } | null;
          }>;

        needs = needsRaw.map((n) => ({
          id: n.id,
          title: n.title,
          spaceId: n.space_id,
          spaceTitle: n.spaces?.name || 'Space',
          type: n.type,
          priority: n.priority,
          href: `/dna/contribute/needs/${n.id}`,
        }));
      }

      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      return {
        events,
        tasks,
        needs,
        totals: {
          eventsToday: events.filter((e) => new Date(e.startsAt) <= todayEnd).length,
          tasksDueSoon: tasks.filter((t) => !t.isStalled).length,
          tasksStalled: tasks.filter((t) => t.isStalled).length,
          openNeeds: needs.length,
        },
      };
    },
  });
}
