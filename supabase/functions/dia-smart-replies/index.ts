// DIA Smart Replies - Phase 12.1
// Returns 2-3 short reply suggestions for the *other* person's most recent
// message in a 1:1 conversation. Cheap, JSON-only, no streaming.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface SuggestionPayload {
  suggestions: string[];
  basedOnMessageId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase env not configured');
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

    const body = await req.json().catch(() => ({}));
    const conversationId = typeof body?.conversationId === 'string' ? body.conversationId : null;
    if (!conversationId) {
      return new Response(JSON.stringify({ error: 'conversationId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pull last 12 messages for context (RLS scoped to participants).
    const { data: messages, error: msgErr } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at, is_deleted')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(12);

    if (msgErr) {
      return new Response(JSON.stringify({ error: msgErr.message }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ordered = (messages ?? []).filter((m) => !m.is_deleted).reverse();
    const lastInbound = [...ordered].reverse().find((m) => m.sender_id !== user.id);
    if (!lastInbound) {
      return new Response(
        JSON.stringify({ suggestions: [], basedOnMessageId: null } as Partial<SuggestionPayload>),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const transcript = ordered
      .map((m) => `${m.sender_id === user.id ? 'You' : 'Them'}: ${m.content ?? ''}`)
      .join('\n');

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
              'You generate 3 short reply suggestions for a 1:1 chat. Replies must be under 12 words, sound natural, in the same language as the last inbound message, and never use em-dashes. No emojis unless the conversation already uses them. Return via the suggest_replies tool.',
          },
          { role: 'user', content: `Conversation:\n${transcript}\n\nReply as "You".` },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_replies',
              description: 'Return 3 short reply suggestions.',
              parameters: {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 2,
                    maxItems: 3,
                  },
                },
                required: ['suggestions'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_replies' } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429 || aiResp.status === 402) {
        return new Response(
          JSON.stringify({
            error: aiResp.status === 429 ? 'Rate limited' : 'Credits exhausted',
          }),
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
    const raw: string[] = Array.isArray(args.suggestions) ? args.suggestions : [];
    const suggestions = raw
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter(Boolean)
      .slice(0, 3);

    const payload: SuggestionPayload = {
      suggestions,
      basedOnMessageId: lastInbound.id,
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('dia-smart-replies error', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
