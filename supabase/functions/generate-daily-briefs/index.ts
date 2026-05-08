import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CModule = 'connect' | 'convene' | 'collaborate' | 'contribute' | 'convey';

interface SignalCandidate {
  c_module: CModule;
  signal_type: string;
  signal_strength: number;
  title: string;
  body: string;
  cta_label: string;
  cta_route: string;
  target_entity_type: string | null;
  target_entity_id: string | null;
  reasoning: string;
  is_fallback: boolean;
}

interface UserContext {
  user_id: string;
  sectors: string[];
  interests: string[];
  connection_count: number;
  followed_hashtags: string[];
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function buildUserContext(userId: string): Promise<UserContext> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('professional_sectors, interests')
    .eq('id', userId)
    .maybeSingle();

  const { count: connectionCount } = await supabase
    .from('connections')
    .select('id', { count: 'exact', head: true })
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .eq('status', 'accepted');

  const { data: follows } = await supabase
    .from('trend_follows')
    .select('hashtag')
    .eq('user_id', userId);

  return {
    user_id: userId,
    sectors: (profile?.professional_sectors as string[] | null) ?? [],
    interests: (profile?.interests as string[] | null) ?? [],
    connection_count: connectionCount ?? 0,
    followed_hashtags: follows?.map((f: { hashtag: string }) => f.hashtag) ?? [],
  };
}

async function generateContributeSignal(ctx: UserContext): Promise<SignalCandidate | null> {
  if (ctx.sectors.length === 0) return null;

  const { data: matches } = await supabase
    .from('opportunities')
    .select('id, title, tags')
    .overlaps('tags', ctx.sectors)
    .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
    .eq('status', 'active')
    .limit(5);

  if (!matches || matches.length === 0) return null;

  return {
    c_module: 'contribute',
    signal_type: 'opportunity_match',
    signal_strength: Math.min(matches.length / 5, 1),
    title: `${matches.length} ${matches.length === 1 ? 'role matches' : 'roles match'} your profile`,
    body: `Recently posted opportunities in ${ctx.sectors.slice(0, 2).join(' and ')} align with your sector tags.`,
    cta_label: 'Review matches',
    cta_route: `/contribute?matched=true&sectors=${encodeURIComponent(ctx.sectors.join(','))}`,
    target_entity_type: matches.length === 1 ? 'opportunity' : null,
    target_entity_id: matches.length === 1 ? matches[0].id : null,
    reasoning: `Matched on sectors: ${ctx.sectors.join(', ')}. ${matches.length} active opportunities in last 7 days.`,
    is_fallback: false,
  };
}

async function generateConnectSignal(ctx: UserContext): Promise<SignalCandidate | null> {
  if (ctx.sectors.length === 0) return null;

  const { data: newMembers } = await supabase
    .from('profiles')
    .select('id, full_name, professional_sectors')
    .overlaps('professional_sectors', ctx.sectors)
    .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
    .neq('id', ctx.user_id)
    .limit(10);

  if (!newMembers || newMembers.length === 0) return null;

  return {
    c_module: 'connect',
    signal_type: 'sector_aligned_returnees',
    signal_strength: Math.min(newMembers.length / 10, 1),
    title: `${newMembers.length} ${newMembers.length === 1 ? 'returnee' : 'returnees'} in your sector this week`,
    body: `Recently joined diaspora members in ${ctx.sectors.slice(0, 2).join(' and ')}.`,
    cta_label: 'See profiles',
    cta_route: `/connect/discover?filter=new&sectors=${encodeURIComponent(ctx.sectors.join(','))}`,
    target_entity_type: null,
    target_entity_id: null,
    reasoning: `${newMembers.length} new members in matching sectors joined in last 7 days.`,
    is_fallback: false,
  };
}

async function generateConveneSignal(_ctx: UserContext): Promise<SignalCandidate | null> {
  const { data: events } = await supabase
    .from('events')
    .select('id, title, start_time')
    .gte('start_time', new Date().toISOString())
    .lte('start_time', new Date(Date.now() + 14 * 86400000).toISOString())
    .eq('is_public', true)
    .eq('is_cancelled', false)
    .order('start_time', { ascending: true })
    .limit(3);

  if (!events || events.length === 0) return null;

  const top = events[0];
  return {
    c_module: 'convene',
    signal_type: 'event_with_network_attendance',
    signal_strength: 0.7,
    title: top.title,
    body: 'Upcoming event in the next 14 days aligned with your network.',
    cta_label: 'View event',
    cta_route: `/convene/${top.id}`,
    target_entity_type: 'event',
    target_entity_id: top.id,
    reasoning: 'Top upcoming event in next 14 days.',
    is_fallback: false,
  };
}

async function generateCollaborateSignal(ctx: UserContext): Promise<SignalCandidate | null> {
  if (ctx.interests.length === 0) return null;

  const { data: spaces } = await supabase
    .from('spaces')
    .select('id, name, slug, focus_areas')
    .overlaps('focus_areas', ctx.interests)
    .eq('status', 'active')
    .eq('visibility', 'public')
    .limit(3);

  if (!spaces || spaces.length === 0) return null;

  const top = spaces[0];
  const { count: memberCount } = await supabase
    .from('space_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('space_id', top.id);

  return {
    c_module: 'collaborate',
    signal_type: 'space_match',
    signal_strength: 0.6,
    title: `Active space matches your interests: ${top.name}`,
    body: `${memberCount ?? 'Several'} members building together in your interest area.`,
    cta_label: 'Explore space',
    cta_route: `/collaborate/${top.slug ?? top.id}`,
    target_entity_type: 'space',
    target_entity_id: top.id,
    reasoning: 'Space focus areas overlap with user interests.',
    is_fallback: false,
  };
}

async function generateConveySignal(ctx: UserContext): Promise<SignalCandidate | null> {
  if (ctx.followed_hashtags.length === 0) return null;

  const { data: trending } = await supabase.rpc('get_trending_hashtags', {
    p_time_range: '24h',
    p_limit: 5,
  });

  const matchingTrend = (trending as Array<{ hashtag: string; post_count: number; unique_authors: number }> | null)
    ?.find((t) => ctx.followed_hashtags.includes(t.hashtag));

  if (!matchingTrend) return null;

  return {
    c_module: 'convey',
    signal_type: 'followed_trend_active',
    signal_strength: 0.5,
    title: `#${matchingTrend.hashtag} is trending`,
    body: `${matchingTrend.post_count} posts in the last 24 hours from ${matchingTrend.unique_authors} authors.`,
    cta_label: 'See conversation',
    cta_route: `/search?hashtag=${encodeURIComponent(matchingTrend.hashtag)}`,
    target_entity_type: null,
    target_entity_id: null,
    reasoning: 'User follows a hashtag with active conversation.',
    is_fallback: false,
  };
}

function generateFallbackCards(ctx: UserContext): SignalCandidate[] {
  const fallbacks: SignalCandidate[] = [];

  if (ctx.sectors.length === 0) {
    fallbacks.push({
      c_module: 'connect',
      signal_type: 'profile_completion',
      signal_strength: 0.3,
      title: 'Complete your profile to unlock matches',
      body: 'Add sectors and expertise so DIA can surface relevant opportunities, connections, and spaces.',
      cta_label: 'Complete profile',
      cta_route: '/profile/edit',
      target_entity_type: null,
      target_entity_id: null,
      reasoning: 'User has no sector tags set.',
      is_fallback: true,
    });
  }

  if (ctx.connection_count < 5) {
    fallbacks.push({
      c_module: 'connect',
      signal_type: 'network_growth',
      signal_strength: 0.3,
      title: 'Grow your network in DNA',
      body: 'Build connections with diaspora members across your sector and geography.',
      cta_label: 'Discover people',
      cta_route: '/connect/discover',
      target_entity_type: null,
      target_entity_id: null,
      reasoning: 'User has fewer than 5 connections.',
      is_fallback: true,
    });
  }

  fallbacks.push({
    c_module: 'convene',
    signal_type: 'evergreen_events',
    signal_strength: 0.2,
    title: 'Upcoming gatherings in DNA',
    body: 'Browse events the diaspora is convening this month.',
    cta_label: 'Browse events',
    cta_route: '/convene',
    target_entity_type: null,
    target_entity_id: null,
    reasoning: 'Evergreen fallback.',
    is_fallback: true,
  });

  return fallbacks;
}

async function generateBriefForUser(userId: string): Promise<void> {
  const ctx = await buildUserContext(userId);

  const candidates = await Promise.all([
    generateContributeSignal(ctx),
    generateConnectSignal(ctx),
    generateConveneSignal(ctx),
    generateCollaborateSignal(ctx),
    generateConveySignal(ctx),
  ]);

  let selected = candidates
    .filter((c): c is SignalCandidate => c !== null)
    .sort((a, b) => b.signal_strength - a.signal_strength);

  // Diversity pass: prefer different C's in top 3
  const seenCs = new Set<CModule>();
  selected = selected.filter((c) => {
    if (seenCs.has(c.c_module)) return false;
    seenCs.add(c.c_module);
    return true;
  }).slice(0, 3);

  if (selected.length < 3) {
    const fallbacks = generateFallbackCards(ctx).filter((f) => !seenCs.has(f.c_module));
    for (const fb of fallbacks) {
      if (selected.length >= 3) break;
      if (seenCs.has(fb.c_module)) continue;
      selected.push(fb);
      seenCs.add(fb.c_module);
    }
  }

  if (selected.length === 0) return;

  const today = new Date().toISOString().slice(0, 10);
  const expiresAt = new Date(Date.now() + 24 * 86400000).toISOString();

  // Replace today's brief atomically: remove any existing rows for this brief_date.
  await supabase
    .from('dia_brief_cards')
    .delete()
    .eq('user_id', userId)
    .eq('brief_date', today);

  const rows = selected.map((card, idx) => ({
    user_id: userId,
    brief_date: today,
    position: idx + 1,
    c_module: card.c_module,
    signal_type: card.signal_type,
    signal_strength: card.signal_strength,
    title: card.title,
    body: card.body,
    cta_label: card.cta_label,
    cta_route: card.cta_route,
    target_entity_type: card.target_entity_type,
    target_entity_id: card.target_entity_id,
    reasoning: card.reasoning,
    is_fallback: card.is_fallback,
    expires_at: expiresAt,
  }));

  const { error } = await supabase.from('dia_brief_cards').insert(rows);
  if (error) {
    console.error(`generate-daily-briefs: insert failed for ${userId}`, error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let targetUserId: string | undefined;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body && typeof body.user_id === 'string') {
          targetUserId = body.user_id;
        }
      } catch {
        // No body — fall through to bulk run
      }
    }

    if (targetUserId) {
      await generateBriefForUser(targetUserId);
      return new Response(
        JSON.stringify({ processed: 1, user_id: targetUserId, timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: activeUsers, error } = await supabase
      .from('profiles')
      .select('id')
      .gte('last_seen_at', new Date(Date.now() - 30 * 86400000).toISOString());

    if (error) {
      console.error('generate-daily-briefs: failed to load active users', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!activeUsers || activeUsers.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const BATCH_SIZE = 50;
    for (let i = 0; i < activeUsers.length; i += BATCH_SIZE) {
      const batch = activeUsers.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((u: { id: string }) => generateBriefForUser(u.id)));
    }

    return new Response(
      JSON.stringify({ processed: activeUsers.length, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('generate-daily-briefs: unhandled error', err);
    const message = err instanceof Error ? err.message : 'unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
