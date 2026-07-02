// supabase/functions/messages-cleanup/index.ts
//
// Phase 10 - Disappearing messages cleanup.
//
// Deletes messages whose parent conversation has a non-null `disappearing_seconds`
// value, where the message's `created_at` plus that interval has elapsed.
//
// Intended to be invoked on a cron schedule. Returns a JSON summary.

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { requireInternal } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const __auth = requireInternal(req);
  if (!__auth.ok) return __auth.response;

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing service env' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(url, serviceKey);

  // Pull eligible conversations with a duration set.
  const { data: convos, error: cErr } = await admin
    .from('conversations')
    .select('id, disappearing_seconds')
    .not('disappearing_seconds', 'is', null);

  if (cErr) {
    return new Response(JSON.stringify({ error: cErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let totalDeleted = 0;
  for (const c of convos ?? []) {
    const seconds = (c as any).disappearing_seconds as number;
    if (!seconds || seconds <= 0) continue;
    const cutoff = new Date(Date.now() - seconds * 1000).toISOString();
    const { error: dErr, count } = await admin
      .from('messages')
      .delete({ count: 'exact' })
      .eq('conversation_id', (c as any).id)
      .lt('created_at', cutoff);
    if (!dErr && typeof count === 'number') totalDeleted += count;
  }

  return new Response(
    JSON.stringify({ ok: true, deleted: totalDeleted, conversations: convos?.length ?? 0 }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
