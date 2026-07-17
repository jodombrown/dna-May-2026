// DIA Thread Summary - Phase 12.2 / 12.3. Re-pointed through dia-core (DIA2/BD125).
// "Catch me up" - summarises recent messages and extracts action items.
// Caches result on conversations.summary_payload keyed by last_summarised_message_id.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { requireUser, callModel, writeEvent, modelFor, makeUserClient } from '../_shared/dia-core/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const CAPABILITY = 'thread_summary' as const;

interface ActionItem {
  title: string;
  kind: 'task' | 'event' | 'note';
  context: string;
  sourceMessageId?: string;
}

interface SummaryPayload {
  generatedAt: string;
  basedOnMessageId: string;
  headline: string;
  bullets: string[];
  openQuestions: string[];
  actionItems: ActionItem[];
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
    const conversationId: string | null =
      typeof body?.conversationId === 'string' ? body.conversationId : null;
    const force: boolean = !!body?.force;
    const sinceMessageId: string | null =
      typeof body?.sinceMessageId === 'string' ? body.sinceMessageId : null;
    const audienceName: string | null =
      typeof body?.audienceName === 'string' ? body.audienceName : null;
    if (!conversationId) {
      return new Response(JSON.stringify({ error: 'conversationId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cache check (skipped when sinceMessageId is provided - per-recipient view is not cached)
    const { data: convRow } = await supabase
      .from('conversations')
      .select('summary_payload, last_summarised_message_id')
      .eq('id', conversationId)
      .maybeSingle();

    // Resolve since timestamp - either from sinceMessageId or fall back to 24h
    let sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    if (sinceMessageId) {
      const { data: anchor } = await supabase
        .from('messages')
        .select('created_at')
        .eq('id', sinceMessageId)
        .maybeSingle();
      if (anchor?.created_at) sinceIso = anchor.created_at as string;
    }

    const { data: messages, error: msgErr } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at, is_deleted')
      .eq('conversation_id', conversationId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .limit(80);

    if (msgErr) {
      return new Response(JSON.stringify({ error: msgErr.message }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const live = (messages ?? []).filter((m) => !m.is_deleted);
    if (live.length === 0) {
      return new Response(
        JSON.stringify({
          generatedAt: new Date().toISOString(),
          basedOnMessageId: '',
          headline: 'Nothing new to catch up on.',
          bullets: [],
          openQuestions: [],
          actionItems: [],
        } satisfies SummaryPayload),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const lastId = live[live.length - 1].id;
    const cacheable = !sinceMessageId;
    if (cacheable && !force && convRow?.last_summarised_message_id === lastId && convRow?.summary_payload) {
      return new Response(JSON.stringify(convRow.summary_payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve display names for "you" / "them"
    const otherIds = Array.from(new Set(live.map((m) => m.sender_id).filter((id) => id !== user.id)));
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', otherIds.length > 0 ? otherIds : ['00000000-0000-0000-0000-000000000000']);
    const nameById = new Map<string, string>();
    (profiles ?? []).forEach((p) => nameById.set(p.id, p.full_name ?? 'Them'));

    const transcript = live
      .map((m) => {
        const who = m.sender_id === user.id ? 'You' : nameById.get(m.sender_id) ?? 'Them';
        return `[${m.id}] ${who}: ${m.content ?? ''}`;
      })
      .join('\n');

    // Model (dia-core). Same messages/tools/tool_choice as before; transport centralized.
    let result;
    try {
      result = await callModel({
        capability: CAPABILITY,
        messages: [
          {
            role: 'system',
            content: `You summarise a recent group or 1:1 chat for ${audienceName ? audienceName : 'the user'}. Be concise. No em-dashes. Use the same language as the conversation. Each bullet must be a complete sentence under 18 words. Action items must be concrete and assignable. When summarising a group, attribute statements to the speaker (e.g. "Ama proposed..."). Use the summarise_thread tool.`,
          },
          { role: 'user', content: `Recent messages (oldest first):\n${transcript}` },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'summarise_thread',
              description: 'Return a structured summary of the conversation.',
              parameters: {
                type: 'object',
                properties: {
                  headline: { type: 'string', description: 'One-sentence summary, under 16 words.' },
                  bullets: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '3 to 5 key points, decisions, or status updates.',
                  },
                  openQuestions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Questions the other party left unanswered. Empty if none.',
                  },
                  actionItems: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        kind: { type: 'string', enum: ['task', 'event', 'note'] },
                        context: { type: 'string' },
                        sourceMessageId: { type: 'string' },
                      },
                      required: ['title', 'kind', 'context'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['headline', 'bullets', 'openQuestions', 'actionItems'],
                additionalProperties: false,
              },
            },
          },
        ],
        toolChoice: { type: 'function', function: { name: 'summarise_thread' } },
      });
    } catch (e) {
      await writeEvent(admin, {
        userId, capability: CAPABILITY, surface: 'dia-thread-summary',
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
      userId, capability: CAPABILITY, surface: 'dia-thread-summary',
      provider: result.provider, model: result.model, success: true,
      latencyMs: Date.now() - startTime, tokens: result.tokens,
      meta: { conversationId, messages: live.length },
    });

    const toolCall = result.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function?.arguments ?? '{}') : {};

    const payload: SummaryPayload = {
      generatedAt: new Date().toISOString(),
      basedOnMessageId: lastId,
      headline: typeof args.headline === 'string' ? args.headline : 'Recent conversation summary',
      bullets: Array.isArray(args.bullets) ? args.bullets.filter((b: unknown) => typeof b === 'string') : [],
      openQuestions: Array.isArray(args.openQuestions)
        ? args.openQuestions.filter((q: unknown) => typeof q === 'string')
        : [],
      actionItems: Array.isArray(args.actionItems)
        ? args.actionItems
            .filter((a: { title?: unknown; kind?: unknown }) => typeof a?.title === 'string')
            .map((a: ActionItem) => ({
              title: a.title,
              kind: ['task', 'event', 'note'].includes(a.kind) ? a.kind : 'task',
              context: typeof a.context === 'string' ? a.context : '',
              sourceMessageId: typeof a.sourceMessageId === 'string' ? a.sourceMessageId : undefined,
            }))
        : [],
    };

    // Cache (best effort, only when summarising the canonical full thread)
    if (cacheable) {
      await supabase
        .from('conversations')
        .update({ summary_payload: payload, last_summarised_message_id: lastId })
        .eq('id', conversationId);
    }

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('dia-thread-summary error', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
