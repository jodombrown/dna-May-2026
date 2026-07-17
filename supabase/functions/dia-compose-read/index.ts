// DIA Compose Read — verb inference + field extraction (BD085). Re-pointed through dia-core (DIA2/BD125).
//
// The member writes plainly. DIA reads it and proposes the verb (which C) and
// the structured fields the card renders. DIA PROPOSES; THE AUTHOR OWNS THE
// FINAL VALUE — nothing here is ever written without the member seeing it.
//
// This replaces a regex extractor that produced noise ("6:00pm" landing in an
// impact field). A model reads any phrasing a person would actually use; a
// pattern-matcher only reads phrasings we anticipated.
//
// Failure is a NO-OP, never an error to the member: if the model is down, slow,
// or unsure, we return { verb: null } and the composer behaves like an ordinary
// composer. A wrong guess is worse than no guess.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { requireUser, callModel, writeEvent, modelFor } from '../_shared/dia-core/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Below this, DIA stays quiet. */
const CONFIDENCE_FLOOR = 0.6;
/** DIA does not interrupt before the member has said enough to be read. */
const MIN_CHARS = 18;
const MAX_CHARS = 4000;
const CAPABILITY = 'compose_read' as const;

const SYSTEM_PROMPT = `You read a draft post for DNA, a platform for the African diaspora, and decide which of the Five C's it is, then extract the structured fields that C's card renders.

THE FIVE VERBS:
- "connect"     (Connect)     — looking for a specific person or offering yourself to someone. Co-founder, investor, mentor, advisor, collaborator, introductions.
- "convene"     (Convene)     — hosting a gathering. Event, meetup, summit, webinar, panel, workshop, call.
- "collaborate" (Collaborate) — starting or recruiting for a piece of ongoing work. A project, initiative, venture, team, Space.
- "contribute"  (Contribute)  — offering something you have, or asking for something you need. Expertise, time, network, knowledge, mentorship, resources.
- "convey"      (Convey)      — telling a story, sharing a thought, an update, an observation, news, a reflection. THIS IS THE DEFAULT when nothing else clearly fits.

CRITICAL DISTINCTIONS:
- "connect" points at a PERSON. "contribute" points at WORK + an OUTCOME. "I need a marketing lead for my startup so we reach 100K users" is contribute (it names an outcome). "Anyone know a good marketing lead?" is connect.
- "collaborate" is ongoing WORK someone joins. "contribute" is a discrete give or ask.
- If it is just a thought, an opinion, news, or a story — it is convey. Do not force it into another verb.

FIELDS BY VERB (omit any field you cannot infer — DO NOT GUESS, DO NOT INVENT):

convene:
  title   — the event name, short. Not a sentence.
  when    — natural language, exactly as written ("Saturday at 6pm", "March 15"). Do NOT invent a date.
  where   — a place. Omit if virtual.
  format  — one of: "In person", "Virtual", "Hybrid"

contribute:
  direction — "offer" (they have something to give) or "need" (they want something)
  kind      — one of: Expertise, Time, Network, Knowledge, Mentorship, Partnership, Resources
  give      — WHAT is on the table, short. "4 hrs/week", "Marketing lead", "Blockchain architecture review"
  to        — WHO or WHAT it goes to. "Health startups", "HealthTech". For an open offer, use "Open to match".
  impact    — THE CONSEQUENCE. "Ship faster", "Reach 100K users". This is the most important field: it is what makes someone act. Only fill it if the text actually names an outcome.

collaborate:
  title — the project/Space name, short.
  roles — comma-separated roles they need. "Solar engineer, Market lead"
  type  — one of: Initiative, Project, Venture, Working group, Campaign

connect:
  intent — who they need, short. "Co-founder", "Investor", "Mentor"
  where  — a place, if mentioned.

convey:
  title — a headline for the story, drawn from what they wrote. Short, not a full sentence.

RULES:
- NEVER invent a value that is not supported by the text. An empty field is correct; a fabricated one is a bug.
- Keep every field under 48 characters.
- confidence is 0-1: how sure you are of the VERB (not the fields).
- If the text is too short, vague, or you are unsure, return verb "convey" with low confidence.

Return ONLY this JSON. No prose, no markdown, no code fences:
{"verb":"convene","confidence":0.9,"fields":{"title":"Founders Meetup","when":"Saturday at 6pm","where":"Lagos","format":"In person"},"reason":"Reads like an event"}`;

const VALID_VERBS = ['connect', 'convene', 'collaborate', 'contribute', 'convey'] as const;
type Verb = (typeof VALID_VERBS)[number];

const FIELD_WHITELIST: Record<Verb, string[]> = {
  convene: ['title', 'when', 'where', 'format'],
  contribute: ['direction', 'kind', 'give', 'to', 'impact'],
  collaborate: ['title', 'roles', 'type'],
  connect: ['intent', 'where'],
  convey: ['title'],
};

/** DIA never returns a field the card cannot render, nor an over-long value. */
function sanitize(verb: Verb, fields: Record<string, unknown>): Record<string, string> {
  const allowed = FIELD_WHITELIST[verb];
  const out: Record<string, string> = {};
  for (const key of allowed) {
    const v = fields?.[key];
    if (typeof v !== 'string') continue;
    const trimmed = v.trim();
    if (!trimmed || trimmed === '-' || trimmed === '—') continue;
    out[key] = trimmed.slice(0, 48);
  }
  if (verb === 'contribute' && out.direction && !['offer', 'need'].includes(out.direction)) {
    delete out.direction;
  }
  return out;
}

/** Silence — the composer carries on as an ordinary composer. */
const quiet = (reason: string) =>
  new Response(JSON.stringify({ verb: null, confidence: 0, fields: {}, reason }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

  try {
    // Identity (dia-core). compose-read reads no data, so no user client is needed.
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === 'string' ? body.text.trim() : '';

    if (text.length < MIN_CHARS) return quiet('too_short');

    // Model (dia-core). Same messages/temperature/max_tokens as before; transport centralized.
    let result;
    try {
      result = await callModel({
        capability: CAPABILITY,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text.slice(0, MAX_CHARS) },
        ],
        temperature: 0.1, // extraction, not creativity
        maxTokens: 300,
      });
    } catch (e) {
      await writeEvent(admin, {
        userId, capability: CAPABILITY, surface: 'dia-compose-read',
        provider: 'gemini', model: modelFor(CAPABILITY), success: false,
        latencyMs: Date.now() - startTime, errorCode: 'model_unavailable',
        errorMessage: String((e as Error)?.message ?? e).slice(0, 300),
      });
      return quiet('model_unavailable'); // degrade, never break the composer
    }

    // Audit (dia-core). One event per model call.
    await writeEvent(admin, {
      userId, capability: CAPABILITY, surface: 'dia-compose-read',
      provider: result.provider, model: result.model, success: true,
      latencyMs: Date.now() - startTime, tokens: result.tokens,
      meta: { chars: text.length },
    });

    const raw = result.message?.content ?? '';

    // The model is told not to fence, but models fence anyway.
    const cleaned = String(raw).replace(/```json|```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return quiet('unparseable');

    let parsed: { verb?: string; confidence?: number; fields?: Record<string, unknown>; reason?: string };
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return quiet('unparseable');
    }

    const verb = parsed.verb as Verb;
    if (!VALID_VERBS.includes(verb)) return quiet('unknown_verb');

    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0;
    if (confidence < CONFIDENCE_FLOOR) return quiet('low_confidence');

    return new Response(
      JSON.stringify({
        verb,
        confidence,
        fields: sanitize(verb, parsed.fields ?? {}),
        reason: typeof parsed.reason === 'string' ? parsed.reason.slice(0, 60) : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('dia-compose-read:', err);
    return quiet('error'); // silence beats a broken composer
  }
});
