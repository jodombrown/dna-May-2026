import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireUser, requireInternal } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const __internal = requireInternal(req);
  let __callerUserId: string | null = null;
  if (!__internal.ok) {
    const __auth = await requireUser(req);
    if (!__auth.ok) return __auth.response;
    __callerUserId = __auth.userId;
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, event_type } = await req.json()

    if (!user_id || !event_type) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or event_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Non-internal callers may only trigger prompts for themselves
    if (__callerUserId && user_id !== __callerUserId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: can only trigger DIA prompt for your own user_id' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Triggering DIA prompt for user ${user_id} with event ${event_type}`)

    // Call trigger_dia_prompt (renamed from trigger_adin_prompt in B3 move 1; verified present in live catalog 2026-07-10)
    const { data, error } = await supabase.rpc('trigger_dia_prompt', {
      target_user_id: user_id,
      event_type: event_type
    })

    if (error) {
      console.error('Error triggering DIA prompt:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('DIA prompt triggered successfully:', data)

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in trigger-adin-prompt (DIA) function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})