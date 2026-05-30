import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireInternal } from "../_shared/auth.ts";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NudgeTemplate {
  type: string
  category: string
  priority: string
  getMessage: (context: any) => string
}

const NUDGE_TEMPLATES: NudgeTemplate[] = [
  {
    type: 'dormant_comeback',
    category: 'engagement',
    priority: 'high',
    getMessage: (ctx) => `We've missed you! Your network has grown by ${ctx.newConnections || 0} connections since your last visit. Check out what's new.`
  },
  {
    type: 'at_risk_post',
    category: 'content',
    priority: 'normal',
    getMessage: (ctx) => `You haven't posted in ${ctx.daysSincePost || 14} days. Share an update with your ${ctx.connectionCount || 0} connections!`
  },
  {
    type: 'new_connections',
    category: 'connection',
    priority: 'normal',
    getMessage: (ctx) => `${ctx.newConnectionRequests || 0} people want to connect with you. View your pending requests.`
  },
  {
    type: 'profile_incomplete',
    category: 'engagement',
    priority: 'normal',
    getMessage: (ctx) => `Your profile is ${ctx.completionPercent || 0}% complete. Add more details to unlock collaboration features.`
  },
  {
    type: 'popular_post',
    category: 'content',
    priority: 'normal',
    getMessage: (ctx) => `Your connection ${ctx.connectionName} posted about ${ctx.topic} - perfect time to reconnect!`
  },
  {
    type: 'weak_connection',
    category: 'connection',
    priority: 'low',
    getMessage: (ctx) => `You haven't connected with ${ctx.connectionName} in ${ctx.daysSinceInteraction} days. Send them a message?`
  }
]

async function generateNudgesForUser(supabase: any, userId: string, tier: string, metrics: any) {
  const nudges: any[] = []
  const now = new Date()

  // Check user's nudge preferences
  const { data: prefs } = await supabase
    .from('adin_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  const enabledCategories = prefs?.nudge_categories || ['connection', 'content', 'engagement']

  // Dormant users - high priority comeback nudge
  if (tier === 'dormant') {
    const { count: newConnections } = await supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq('status', 'accepted')
      .gte('created_at', metrics.last_login || new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())

    nudges.push({
      user_id: userId,
      nudge_type: 'dormant_comeback',
      nudge_category: 'engagement',
      priority: 'high',
      message: NUDGE_TEMPLATES[0].getMessage({ newConnections }),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
  }

  // At risk users - encourage posting
  if ((tier === 'at_risk' || tier === 'moderate') && enabledCategories.includes('content')) {
    const daysSincePost = metrics.last_post_created 
      ? Math.floor((now.getTime() - new Date(metrics.last_post_created).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    if (daysSincePost > 14) {
      nudges.push({
        user_id: userId,
        nudge_type: 'at_risk_post',
        nudge_category: 'content',
        priority: 'normal',
        message: NUDGE_TEMPLATES[1].getMessage({ 
          daysSincePost, 
          connectionCount: metrics.total_connections 
        }),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
    }
  }

  // Check for pending connection requests
  if (enabledCategories.includes('connection')) {
    const { count: pendingRequests } = await supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('status', 'pending')

    if (pendingRequests && pendingRequests > 0) {
      nudges.push({
        user_id: userId,
        nudge_type: 'new_connections',
        nudge_category: 'connection',
        priority: 'normal',
        message: NUDGE_TEMPLATES[2].getMessage({ newConnectionRequests: pendingRequests }),
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      })
    }
  }

  // Check profile completeness
  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_completion_percentage')
    .eq('id', userId)
    .single()

  if (profile && profile.profile_completion_percentage < 60) {
    nudges.push({
      user_id: userId,
      nudge_type: 'profile_incomplete',
      nudge_category: 'engagement',
      priority: 'normal',
      message: NUDGE_TEMPLATES[3].getMessage({ completionPercent: profile.profile_completion_percentage }),
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    })
  }

  return nudges
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting engagement reminders generation...')

    // Get users that need nudges (at_risk and dormant)
    const { data: usersToNudge, error: fetchError } = await supabase
      .from('user_engagement_tracking')
      .select('*')
      .in('engagement_tier', ['at_risk', 'dormant', 'moderate'])

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${usersToNudge?.length || 0} users to process...`)

    let nudgesCreated = 0

    for (const user of usersToNudge || []) {
      try {
        // Check if user already has recent nudges
        const { data: recentNudges } = await supabase
          .from('adin_nudges')
          .select('id')
          .eq('user_id', user.user_id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        // Skip if already nudged today
        if (recentNudges && recentNudges.length > 0) {
          continue
        }

        // Generate personalized nudges
        const nudges = await generateNudgesForUser(supabase, user.user_id, user.engagement_tier, user)

        // Insert nudges
        for (const nudge of nudges) {
          const { error: insertError } = await supabase
            .from('adin_nudges')
            .insert(nudge)

          if (insertError) {
            console.error(`Error creating nudge for user ${user.user_id}:`, insertError)
          } else {
            nudgesCreated++

            // Log to reminder_logs
            await supabase
              .from('reminder_logs')
              .insert({
                user_id: user.user_id,
                reminder_type: nudge.nudge_type,
                reminder_content: { message: nudge.message, category: nudge.nudge_category }
              })
          }
        }

      } catch (userError) {
        console.error(`Error processing user ${user.user_id}:`, userError)
      }
    }

    console.log(`Engagement reminders complete. Created ${nudgesCreated} nudges.`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: usersToNudge?.length || 0,
        nudges_created: nudgesCreated
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in engagement-reminders:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
