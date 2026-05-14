// Nightly inbox digest. Sends one email to each user with unread messages
// who has not been seen in the last 24h and has email_digest=true.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Pull users with unread + opted-in + stale presence
    const { data: candidates, error } = await supabase.rpc("get_email_digest_recipients");
    if (error) throw error;

    let sent = 0;
    for (const row of (candidates || []) as Array<{
      user_id: string;
      email: string;
      full_name: string | null;
      unread_total: number;
      conversation_count: number;
    }>) {
      try {
        await supabase.functions.invoke("send-universal-email", {
          body: {
            type: "user_notification",
            data: {
              to: row.email,
              subject: `You have ${row.unread_total} unread message${row.unread_total === 1 ? "" : "s"} on DNA`,
              html: `
                <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#F9F7F4;color:#1A1A1A">
                  <h1 style="font-family:Lora,serif;font-size:22px;margin:0 0 12px">Hi ${row.full_name || "there"},</h1>
                  <p style="font-size:15px;line-height:1.5">You have <strong>${row.unread_total} unread message${row.unread_total === 1 ? "" : "s"}</strong> across ${row.conversation_count} conversation${row.conversation_count === 1 ? "" : "s"} waiting for you.</p>
                  <p style="margin:24px 0">
                    <a href="https://diasporanetwork.africa/dna/messages" style="background:#4A8D77;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:600">Open inbox</a>
                  </p>
                  <p style="font-size:12px;color:#666;margin-top:32px">You can turn off these digests in Messages settings.</p>
                </div>`,
            },
          },
        });
        sent++;
      } catch (e) {
        console.error("digest send failed for", row.user_id, e);
      }
    }

    return new Response(JSON.stringify({ ok: true, candidates: candidates?.length ?? 0, sent }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
