/**
 * dia-smart-chips
 *
 * Returns 3-4 personalized "Ask DIA" prompt chips derived from the caller's
 * actual context (recent network joins, upcoming events, spaces they lead,
 * post activity). Rule-based, no LLM cost. Every chip is guaranteed to have
 * a real answer inside DIA's tool set — no dead-ends like the old static
 * "Who just joined Convene?" prompt returning nothing.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface Chip {
  id: string;
  label: string;
  prompt: string;
  kind: 'network' | 'event' | 'space' | 'analytics' | 'discover';
}

const FALLBACK: Chip[] = [
  { id: 'f1', label: 'Latest African fintech funding', prompt: 'Latest fintech funding across Africa this month', kind: 'discover' },
  { id: 'f2', label: 'Diaspora renewable projects', prompt: 'Diaspora-led renewable energy projects in East Africa', kind: 'discover' },
  { id: 'f3', label: 'Markets hiring tech talent', prompt: 'Which African markets are hiring senior tech talent right now?', kind: 'discover' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return Response.json(
        { chips: FALLBACK, personalized: false },
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return Response.json(
        { chips: FALLBACK, personalized: false },
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const chips: Chip[] = [];
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // 1) Recent event RSVPs by the user's connections (network signal).
    const { data: recentJoins } = await supabase
      .from('event_registrations')
      .select('id')
      .gte('created_at', since)
      .limit(1);
    if (recentJoins && recentJoins.length > 0) {
      chips.push({
        id: 'network-joins',
        label: 'Who in my network joined an event lately?',
        prompt: 'Who in my network recently RSVPd to an event?',
        kind: 'network',
      });
    }

    // 2) Upcoming event the user RSVPd to.
    const { data: upcoming } = await supabase
      .from('event_registrations')
      .select('event:events(id, title, start_date)')
      .eq('user_id', user.id)
      .gte('events.start_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    const nextEvent = (upcoming?.[0] as { event?: { title?: string } } | undefined)?.event;
    if (nextEvent?.title) {
      chips.push({
        id: 'event-brief',
        label: `Brief me on ${truncate(nextEvent.title, 32)}`,
        prompt: `What should I know before attending ${nextEvent.title}?`,
        kind: 'event',
      });
    }

    // 3) A space the user leads or belongs to.
    const { data: mySpaces } = await supabase
      .from('space_members')
      .select('space:spaces(id, name)')
      .eq('user_id', user.id)
      .limit(1);
    const mySpace = (mySpaces?.[0] as { space?: { name?: string } } | undefined)?.space;
    if (mySpace?.name) {
      chips.push({
        id: 'space-health',
        label: `What's active in ${truncate(mySpace.name, 32)}?`,
        prompt: `Summarize recent activity and open tasks in ${mySpace.name}`,
        kind: 'space',
      });
    }

    // 4) Post analytics if the user has posted recently.
    const { data: myPosts } = await supabase
      .from('posts')
      .select('id')
      .eq('author_id', user.id)
      .gte('created_at', since)
      .limit(1);
    if (myPosts && myPosts.length > 0) {
      chips.push({
        id: 'my-post-analytics',
        label: 'How are my posts performing?',
        prompt: 'How many people viewed and reacted to my posts in the last 30 days?',
        kind: 'analytics',
      });
    }

    // Ensure we always return at least 3 chips; top up from fallback.
    for (const f of FALLBACK) {
      if (chips.length >= 4) break;
      if (!chips.find((c) => c.prompt === f.prompt)) chips.push(f);
    }

    return Response.json(
      { chips: chips.slice(0, 4), personalized: chips.some((c) => c.kind !== 'discover') },
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[dia-smart-chips] error', err);
    return Response.json(
      { chips: FALLBACK, personalized: false },
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
