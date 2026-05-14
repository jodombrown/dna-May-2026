// Phase 16 - Cross-thread inbox brief.
// Builds a short narrative across the user's most active unread threads.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThreadHighlight {
  threadId: string;
  threadType: 'direct' | 'group';
  title: string;
  oneLiner: string;
  suggestion: string;
}

interface InboxBriefPayload {
  generatedAt: string;
  basedOnThreadIds: string[];
  headline: string;
  narrative: string;
  highlights: ThreadHighlight[];
  totalUnread: number;
  unreadThreadCount: number;
}

const empty = (totalUnread: number, unreadThreadCount: number): InboxBriefPayload => ({
  generatedAt: new Date().toISOString(),
  basedOnThreadIds: [],
  headline: 'You are all caught up across every thread.',
  narrative: 'Nothing new across your inbox right now. Come back later for fresh activity.',
  highlights: [],
  totalUnread,
  unreadThreadCount,
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Required env vars not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Direct conversations the user participates in
    const { data: convs } = await supabase
      .from('conversations')
      .select('id, user_a, user_b, last_message_at')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(30);

    const directList: Array<{ id: string; otherId: string; lastReadAt: string | null }> = [];
    for (const c of convs ?? []) {
      const otherId = c.user_a === user.id ? c.user_b : c.user_a;
      const { data: part } = await supabase
        .from('conversation_participants')
        .select('last_read_at')
        .eq('conversation_id', c.id)
        .eq('user_id', user.id)
        .maybeSingle();
      directList.push({ id: c.id, otherId, lastReadAt: part?.last_read_at ?? null });
    }

    // Resolve other-user names
    const otherIds = Array.from(new Set(directList.map((d) => d.otherId)));
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .in('id', otherIds.length > 0 ? otherIds : ['00000000-0000-0000-0000-000000000000']);
    const profileById = new Map<string, { full_name: string | null; username: string | null }>();
    (profiles ?? []).forEach((p) =>
      profileById.set(p.id, { full_name: p.full_name, username: p.username }),
    );

    // Pull recent unread direct messages per thread
    interface Snippet {
      threadId: string;
      threadType: 'direct' | 'group';
      title: string;
      author: string;
      content: string;
      createdAt: string;
    }
    const snippets: Snippet[] = [];

    for (const d of directList) {
      const sinceIso = d.lastReadAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at')
        .eq('conversation_id', d.id)
        .gt('created_at', sinceIso)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (!msgs || msgs.length === 0) continue;
      const profile = profileById.get(d.otherId);
      const title = profile?.full_name || profile?.username || 'Member';
      for (const m of msgs.slice(0, 3)) {
        snippets.push({
          threadId: d.id,
          threadType: 'direct',
          title,
          author: title,
          content: (m.content ?? '').slice(0, 240),
          createdAt: m.created_at,
        });
      }
    }

    // Group conversations
    const { data: groups } = await supabase.rpc('get_group_conversations_for_user');
    interface GroupRow {
      conversation_id: string;
      title: string | null;
      unread_count: number;
    }
    const groupRows = ((groups ?? []) as unknown as GroupRow[]).filter((g) => (g.unread_count ?? 0) > 0);

    for (const g of groupRows.slice(0, 10)) {
      const { data: gMsgs } = await supabase.rpc('get_group_messages', {
        p_conversation_id: g.conversation_id,
        p_limit: 6,
        p_before_id: null,
      });
      interface GMsg {
        message_id: string;
        sender_id: string;
        sender_full_name: string | null;
        content: string | null;
        created_at: string;
        message_type: string | null;
      }
      const list = ((gMsgs ?? []) as unknown as GMsg[])
        .filter((m) => m.sender_id !== user.id && m.message_type !== 'system')
        .slice(0, 3);
      for (const m of list) {
        snippets.push({
          threadId: g.conversation_id,
          threadType: 'group',
          title: g.title ?? 'Group chat',
          author: m.sender_full_name ?? 'Member',
          content: (m.content ?? '').slice(0, 240),
          createdAt: m.created_at,
        });
      }
    }

    const totalUnread = snippets.length;
    const threadIds = Array.from(new Set(snippets.map((s) => s.threadId)));
    if (snippets.length === 0) {
      return new Response(JSON.stringify(empty(0, 0)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build a compact transcript grouped by thread
    const byThread = new Map<string, Snippet[]>();
    snippets.forEach((s) => {
      const arr = byThread.get(s.threadId) ?? [];
      arr.push(s);
      byThread.set(s.threadId, arr);
    });
    const transcript = Array.from(byThread.entries())
      .slice(0, 8)
      .map(([_, items], i) => {
        const head = items[0];
        const lines = items.map((m) => `  - ${m.author}: ${m.content}`).join('\n');
        return `Thread ${i + 1} [${head.threadType}] "${head.title}" (id=${head.threadId}):\n${lines}`;
      })
      .join('\n\n');

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content:
              'You produce a short cross-thread inbox brief for the user. No em-dashes. Same language as the messages. Headline under 14 words. Narrative under 3 sentences, plain and warm. For each thread highlight, give one factual one-liner and one concrete next-step suggestion (under 12 words).',
          },
          {
            role: 'user',
            content: `Here are recent unread messages across the user's threads:\n\n${transcript}\n\nUse the build_inbox_brief tool.`,
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'build_inbox_brief',
              description: 'Return a structured cross-thread inbox brief.',
              parameters: {
                type: 'object',
                properties: {
                  headline: { type: 'string' },
                  narrative: { type: 'string' },
                  highlights: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        threadId: { type: 'string' },
                        threadType: { type: 'string', enum: ['direct', 'group'] },
                        title: { type: 'string' },
                        oneLiner: { type: 'string' },
                        suggestion: { type: 'string' },
                      },
                      required: ['threadId', 'threadType', 'title', 'oneLiner', 'suggestion'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['headline', 'narrative', 'highlights'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'build_inbox_brief' } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429 || aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: aiResp.status === 429 ? 'Rate limited' : 'Credits exhausted' }),
          { status: aiResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      const t = await aiResp.text();
      console.error('AI error', aiResp.status, t);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function?.arguments ?? '{}') : {};

    const payload: InboxBriefPayload = {
      generatedAt: new Date().toISOString(),
      basedOnThreadIds: threadIds,
      headline: typeof args.headline === 'string' ? args.headline : 'Here is what is new in your inbox.',
      narrative: typeof args.narrative === 'string' ? args.narrative : '',
      highlights: Array.isArray(args.highlights)
        ? args.highlights
            .filter((h: { threadId?: unknown }) => typeof h?.threadId === 'string')
            .map((h: ThreadHighlight) => ({
              threadId: h.threadId,
              threadType: h.threadType === 'group' ? 'group' : 'direct',
              title: typeof h.title === 'string' ? h.title : '',
              oneLiner: typeof h.oneLiner === 'string' ? h.oneLiner : '',
              suggestion: typeof h.suggestion === 'string' ? h.suggestion : '',
            }))
        : [],
      totalUnread,
      unreadThreadCount: threadIds.length,
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('dia-inbox-brief error', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
