// DIA Smart Replies - Phase 12.1. Re-pointed through dia-core (DIA2/BD125).
// Returns 2-3 short reply suggestions for the *other* person's most recent
// message in a 1:1 conversation. Cheap, JSON-only, no streaming.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { requireUser, callModel, writeEvent, modelFor, makeUserClient } from '../_shared/dia-core/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const CAPABILITY = 'smart_replies' as const;

interface SuggestionPayload {
  suggestions: string[];
  basedOnMessageId: string;
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
    const user = { id: userId };
    const supabase = makeUserClient(auth.token);

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

    // Model (dia-core). Same messages/tools/tool_choice as before; transport centralized.
    let result;
    try {
      result = await callModel({
        capability: CAPABILITY,
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
        toolChoice: { type: 'function', function: { name: 'suggest_replies' } },
      });
    } catch (e) {
      await writeEvent(admin, {
        userId, capability: CAPABILITY, surface: 'dia-smart-replies',
        provider: 'gemini', model: modelFor(CAPABILITY), success: false,
        latencyMs: Date.now() - startTime, errorCode: 'model_unavailable',
        errorMessage: String((e as Error)?.message ?? e).slice(0, 300),
        meta: { conversationId },
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
      userId, capability: CAPABILITY, surface: 'dia-smart-replies',
      provider: result.provider, model: result.model, success: true,
      latencyMs: Date.now() - startTime, tokens: result.tokens,
      meta: { conversationId },
    });

    const toolCall = result.message?.tool_calls?.[0];
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
