// DIA Smart Compose - Phase 19
// Returns 3 short opener suggestions for a NEW 1:1 thread with zero history.
// Uses both users' public profile context to make openers personal but neutral.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface ComposePayload {
  suggestions: string[];
  basedOnUserId: string;
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
    const me = userData?.user;
    if (!me) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const otherUserId = typeof body?.otherUserId === 'string' ? body.otherUserId : null;
    if (!otherUserId) {
      return new Response(JSON.stringify({ error: 'otherUserId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch lightweight profile context for both sides.
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, full_name, headline, bio, current_city, current_country, ethnic_heritage, professional_sectors')
      .in('id', [me.id, otherUserId]);

    if (profErr) {
      return new Response(JSON.stringify({ error: profErr.message }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const meProfile = profiles?.find((p) => p.id === me.id);
    const otherProfile = profiles?.find((p) => p.id === otherUserId);
    if (!otherProfile) {
      return new Response(
        JSON.stringify({ suggestions: [], basedOnUserId: otherUserId } satisfies ComposePayload),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const fmtProfile = (label: string, p: typeof otherProfile) =>
      `${label}: name=${p.full_name ?? '?'}; headline=${p.headline ?? '-'}; sector=${(Array.isArray(p.professional_sectors) ? p.professional_sectors.join(', ') : p.professional_sectors) || '-'}; heritage=${Array.isArray(p.ethnic_heritage) ? (p.ethnic_heritage.join(', ') || '-') : (p.ethnic_heritage ?? '-')}; location=${[p.current_city, p.current_country].filter(Boolean).join(', ') || '-'}`;

    const context = [
      meProfile ? fmtProfile('Sender', meProfile) : '',
      fmtProfile('Recipient', otherProfile),
    ].filter(Boolean).join('\n');

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
              'You generate 3 short opening messages for a first-time 1:1 chat between two members of the African diaspora network. Each opener must: be under 22 words, be warm but professional, reference one concrete shared dimension (sector, heritage, location, or work) when available, never use em-dashes, never use emojis, and never invent facts not in context. Return via the suggest_openers tool.',
          },
          { role: 'user', content: `Context:\n${context}\n\nWrite 3 distinct openers the Sender could send to the Recipient. Vary tone: 1 warm intro, 1 curiosity question, 1 specific collaboration prompt.` },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_openers',
              description: 'Return 3 short opening message suggestions.',
              parameters: {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 3,
                    maxItems: 3,
                  },
                },
                required: ['suggestions'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_openers' } },
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
      .map((s) => (typeof s === 'string' ? s.trim().replace(/\u2014/g, '-') : ''))
      .filter(Boolean)
      .slice(0, 3);

    const payload: ComposePayload = { suggestions, basedOnUserId: otherUserId };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('dia-smart-compose error', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
