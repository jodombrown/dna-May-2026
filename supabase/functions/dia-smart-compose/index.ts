// DIA Smart Compose - Phase 19. Re-pointed through dia-core (DIA2/BD125).
// Returns 3 short opener suggestions for a NEW 1:1 thread with zero history.
// Uses both users' public profile context to make openers personal but neutral.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { requireUser, callModel, writeEvent, modelFor, makeUserClient } from '../_shared/dia-core/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const CAPABILITY = 'smart_compose' as const;

interface ComposePayload {
  suggestions: string[];
  basedOnUserId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

  try {
    // Identity (dia-core). Recreate the RLS-scoped client under the same name.
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;
    const userId = auth.userId;
    const me = { id: userId };
    const supabase = makeUserClient(auth.token);

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

    // Model (dia-core). Same messages/tools/tool_choice as before; transport centralized.
    let result;
    try {
      result = await callModel({
        capability: CAPABILITY,
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
        toolChoice: { type: 'function', function: { name: 'suggest_openers' } },
      });
    } catch (e) {
      await writeEvent(admin, {
        userId, capability: CAPABILITY, surface: 'dia-smart-compose',
        provider: 'gemini', model: modelFor(CAPABILITY), success: false,
        latencyMs: Date.now() - startTime, errorCode: 'model_unavailable',
        errorMessage: String((e as Error)?.message ?? e).slice(0, 300),
        meta: { otherUserId },
      });
      const status = Number(String((e as Error)?.message ?? '').match(/gateway (\d+)/)?.[1]);
      if (status === 429 || status === 402) {
        return new Response(
          JSON.stringify({ error: status === 429 ? 'Rate limited' : 'Credits exhausted' }),
          { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      console.error('AI error', (e as Error)?.message ?? e);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Audit (dia-core). One event per model call.
    await writeEvent(admin, {
      userId, capability: CAPABILITY, surface: 'dia-smart-compose',
      provider: result.provider, model: result.model, success: true,
      latencyMs: Date.now() - startTime, tokens: result.tokens,
      meta: { otherUserId },
    });

    const toolCall = result.message?.tool_calls?.[0];
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
