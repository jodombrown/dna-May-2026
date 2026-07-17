// DIA feedback — thumbs up / down on a DIA answer.
// Writes to public.dia_messaging_feedback so we can measure answer quality
// over time (Phase 4 telemetry loop).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { modelFor } from "../_shared/dia-core/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { query_hash, helpful, variant } = await req.json();
    if (typeof helpful !== "boolean" || !query_hash) {
      return new Response(JSON.stringify({ error: "query_hash and helpful required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await admin.from("dia_messaging_feedback").insert({
      user_id: user.id,
      surface: "dia_search",
      helpful,
      ref_id: String(query_hash),
      model: modelFor("reactive_query"),
      variant: variant ?? null,
    });

    return new Response(JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? "server_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
