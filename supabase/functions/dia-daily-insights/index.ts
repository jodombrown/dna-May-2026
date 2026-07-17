// Daily-refreshing DIA insights: topics that impact the Global African
// Diaspora and the African continent as it relates to progress.
// On invocation, ensures today's set of 6 curated topics exists in
// public.dia_insights (start_date = today, is_active = true).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { callModel, writeEvent, modelFor } from '../_shared/dia-core/index.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CAPABILITY = 'daily_insights' as const;

const ALLOWED_CATEGORIES = [
  'fintech', 'energy', 'tech', 'agriculture', 'real-estate',
  'creative', 'healthcare', 'education',
] as const;
const ALLOWED_REGIONS = [
  'west-africa', 'east-africa', 'north-africa',
  'southern-africa', 'central-africa',
];

interface GeneratedInsight {
  title: string;
  description: string;
  query_prompt: string;
  category: string;
  region: string | null;
}

interface TopicsResult {
  topics: GeneratedInsight[];
  provider: string;
  model: string;
  tokens: number;
}

async function generateTopics(): Promise<TopicsResult> {
  const today = new Date().toISOString().slice(0, 10);
  const system = `You curate 6 daily briefing topics for the DNA (Diaspora Network of Africa) platform.
Each topic must be timely, non-partisan, and directly relevant to progress for the Global African Diaspora AND/OR the African continent.
Cover a mix of: economic development, investment, remittances, technology, policy, culture, education, healthcare, energy, climate, trade.
Do NOT use em-dashes. Use plain hyphens or restructure.
Return STRICT JSON only, no prose.`;

  const user = `Today is ${today}. Generate 6 insight cards.
Each item shape:
{
  "title": "short headline, 6-10 words, no em-dashes",
  "description": "1-2 sentence hook explaining why it matters now, <= 220 chars",
  "query_prompt": "the exact question a user would ask DIA to explore this topic",
  "category": "one of: ${ALLOWED_CATEGORIES.join(', ')}",
  "region": "one of: ${ALLOWED_REGIONS.join(', ')} OR null for continent-wide/global"
}
Return: { "insights": [ ...6 items... ] }`;

  // Model (dia-core). responseFormat preserves the structured-output constraint.
  const result = await callModel({
    capability: CAPABILITY,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    responseFormat: { type: 'json_object' },
    maxTokens: 2000,
  });
  const content = result.message?.content ?? '{}';
  const parsed = JSON.parse(content);
  const items = Array.isArray(parsed.insights) ? parsed.insights : [];
  const topics = items.slice(0, 6).map((i: GeneratedInsight) => ({
    title: String(i.title || '').replace(/[—–]/g, '-').slice(0, 120),
    description: String(i.description || '').replace(/[—–]/g, '-').slice(0, 260),
    query_prompt: String(i.query_prompt || i.title || '').slice(0, 400),
    category: ALLOWED_CATEGORIES.includes(i.category as (typeof ALLOWED_CATEGORIES)[number])
      ? i.category
      : 'tech',
    region: i.region && ALLOWED_REGIONS.includes(i.region) ? i.region : null,
  }));
  return { topics, provider: result.provider, model: result.model, tokens: result.tokens };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const today = new Date().toISOString().slice(0, 10);

  try {
    // Fast path: today's set already exists.
    const { data: existing } = await admin
      .from('dia_insights')
      .select('id')
      .eq('start_date', today)
      .eq('is_active', true)
      .limit(1);
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ ok: true, generated: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const gen = await generateTopics();
    const topics = gen.topics;
    if (topics.length === 0) throw new Error('no topics generated');

    // Retire prior rows so the sheet only shows today's set.
    await admin.from('dia_insights').update({ is_active: false }).eq('is_active', true);

    const rows = topics.map((t, idx) => ({
      title: t.title,
      description: t.description,
      query_prompt: t.query_prompt,
      category: t.category,
      region: t.region,
      is_active: true,
      is_featured: idx === 0,
      display_order: idx + 1,
      start_date: today,
    }));
    const { error: insErr } = await admin.from('dia_insights').insert(rows);
    if (insErr) throw insErr;

    // Audit (dia-core). One service-principal event per generated insight set —
    // dia-daily-insights is global, not user-scoped.
    await writeEvent(admin, {
      userId: null,
      principalType: 'service',
      capability: CAPABILITY,
      surface: 'dia-daily-insights',
      provider: gen.provider,
      model: gen.model,
      success: true,
      tokens: gen.tokens,
      meta: { generated: rows.length },
    });

    return new Response(JSON.stringify({ ok: true, generated: true, count: rows.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    await writeEvent(admin, {
      userId: null,
      principalType: 'service',
      capability: CAPABILITY,
      surface: 'dia-daily-insights',
      model: modelFor(CAPABILITY),
      success: false,
      errorCode: 'generation_failed',
      errorMessage: e instanceof Error ? e.message.slice(0, 300) : String(e).slice(0, 300),
    });
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
