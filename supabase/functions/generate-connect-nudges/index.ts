import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { requireInternal } from "../_shared/auth.ts";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NudgeCandidate {
  user_id: string;
  connections_count: number;
  account_age_days: number;
  days_since_last_seen: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const __auth = requireInternal(req);
  if (!__auth.ok) return __auth.response;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting DIA Connect nudge generation...');

    // Find users who need connection nudges (0 connections, account age >= 3 days)
    const { data: newUserCandidates, error: newUserError } = await supabase.rpc(
      'get_users_needing_connection_nudges'
    );

    if (newUserError) {
      console.error('Error fetching new user candidates:', newUserError);
    } else if (newUserCandidates && newUserCandidates.length > 0) {
      console.log(`Found ${newUserCandidates.length} users needing first connection nudges`);

      for (const candidate of newUserCandidates) {
        // Get suggested connections for this user
        const { data: suggestions } = await supabase.rpc('get_suggested_connections', {
          p_user_id: candidate.user_id,
        });

        if (suggestions && suggestions.length > 0) {
          const topSuggestions = suggestions.slice(0, 3);
          
          // Create nudge
          await supabase.from('adin_nudges').insert({
            user_id: candidate.user_id,
            message: `You're new to DNA! Here are ${topSuggestions.length} members you might want to connect with.`,
            action_url: '/dna/connect/discover',
            priority: 'medium',
            status: 'sent',
            metadata: {
              type: 'first_connections',
              suggested_user_ids: topSuggestions.map((s: any) => s.id),
            },
          });

          console.log(`Created first connection nudge for user ${candidate.user_id}`);
        }
      }
    }

    // Find inactive users (last seen > 7 days ago)
    const { data: inactiveUsers, error: inactiveError } = await supabase.rpc(
      'get_inactive_users_for_reengagement'
    );

    if (inactiveError) {
      console.error('Error fetching inactive users:', inactiveError);
    } else if (inactiveUsers && inactiveUsers.length > 0) {
      console.log(`Found ${inactiveUsers.length} inactive users for re-engagement`);

      for (const user of inactiveUsers) {
        // Create re-engagement nudge
        await supabase.from('adin_nudges').insert({
          user_id: user.user_id,
          message: 'Come back and discover new members in your network!',
          action_url: '/dna/connect/discover',
          priority: 'low',
          status: 'sent',
          metadata: {
            type: 'reengagement',
            days_inactive: user.days_since_last_seen,
          },
        });

        console.log(`Created re-engagement nudge for user ${user.user_id}`);
      }
    }

    const totalNudges = (newUserCandidates?.length || 0) + (inactiveUsers?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        nudges_created: totalNudges,
        new_user_nudges: newUserCandidates?.length || 0,
        reengagement_nudges: inactiveUsers?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-connect-nudges:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
