import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireInternal } from "../_shared/auth.ts";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EngagementMetrics {
  user_id: string
  posts_7d: number
  comments_7d: number
  connections_7d: number
  messages_7d: number
  events_7d: number
  total_posts: number
  total_comments: number
  total_connections: number
  total_messages: number
  last_login?: string
  last_post?: string
  last_comment?: string
  last_connection?: string
  last_message?: string
  last_event?: string
}

function calculateEngagementScore(metrics: EngagementMetrics): number {
  let score = 0
  
  // Posts created (max 30 points)
  score += Math.min(metrics.posts_7d * 10, 30)
  
  // Comments (max 20 points)
  score += Math.min(metrics.comments_7d * 5, 20)
  
  // Connections made (max 24 points)
  score += Math.min(metrics.connections_7d * 8, 24)
  
  // Messages sent (max 12 points)
  score += Math.min(metrics.messages_7d * 3, 12)
  
  // Events attended (max 14 points)
  score += Math.min(metrics.events_7d * 7, 14)
  
  return Math.min(score, 100)
}

function determineEngagementTier(score: number, lastLogin?: string): string {
  const now = new Date()
  const lastLoginDate = lastLogin ? new Date(lastLogin) : null
  const daysSinceLogin = lastLoginDate 
    ? (now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
    : 999
  
  // Dormant: no activity 60+ days
  if (daysSinceLogin > 60 || score < 10) {
    return 'dormant'
  }
  
  // At Risk: inactive 30-60 days or low score
  if (daysSinceLogin > 30 || (score >= 10 && score < 25)) {
    return 'at_risk'
  }
  
  // Moderate: active in last 30 days, moderate score
  if (daysSinceLogin <= 30 && score >= 25 && score < 50) {
    return 'moderate'
  }
  
  // Active: active in last 14 days, good score
  if (daysSinceLogin <= 14 && score >= 50 && score < 80) {
    return 'active'
  }
  
  // Champion: active weekly, high score
  if (daysSinceLogin <= 7 && score >= 80) {
    return 'champion'
  }
  
  return 'new'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const __auth = requireInternal(req);
  if (!__auth.ok) return __auth.response;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting engagement tracking update...')

    // Get all active users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true)

    if (profileError) {
      throw profileError
    }

    console.log(`Processing ${profiles?.length || 0} users...`)

    let updatedCount = 0
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    for (const profile of profiles || []) {
      try {
        // Fetch activity metrics for the last 7 days
        const [postsData, commentsData, connectionsData, messagesData, eventsData] = await Promise.all([
          supabase.from('posts').select('id, created_at').eq('author_id', profile.id).gte('created_at', sevenDaysAgo.toISOString()),
          supabase.from('post_comments').select('id, created_at').eq('author_id', profile.id).gte('created_at', sevenDaysAgo.toISOString()),
          supabase.from('connections').select('id, created_at').or(`requester_id.eq.${profile.id},recipient_id.eq.${profile.id}`).eq('status', 'accepted').gte('created_at', sevenDaysAgo.toISOString()),
          supabase.from('messages').select('id, created_at').eq('sender_id', profile.id).gte('created_at', sevenDaysAgo.toISOString()),
          supabase.from('event_attendees').select('id, created_at').eq('user_id', profile.id).gte('created_at', sevenDaysAgo.toISOString())
        ])

        // Fetch total counts
        const [totalPostsData, totalCommentsData, totalConnectionsData, totalMessagesData] = await Promise.all([
          supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', profile.id),
          supabase.from('post_comments').select('id', { count: 'exact', head: true }).eq('author_id', profile.id),
          supabase.from('connections').select('id', { count: 'exact', head: true }).or(`requester_id.eq.${profile.id},recipient_id.eq.${profile.id}`).eq('status', 'accepted'),
          supabase.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', profile.id)
        ])

        // Get last activity timestamps
        const lastPost = postsData.data?.[0]?.created_at
        const lastComment = commentsData.data?.[0]?.created_at
        const lastConnection = connectionsData.data?.[0]?.created_at
        const lastMessage = messagesData.data?.[0]?.created_at
        const lastEvent = eventsData.data?.[0]?.created_at

        // Get last login from profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('last_seen_at')
          .eq('id', profile.id)
          .single()

        const metrics: EngagementMetrics = {
          user_id: profile.id,
          posts_7d: postsData.data?.length || 0,
          comments_7d: commentsData.data?.length || 0,
          connections_7d: connectionsData.data?.length || 0,
          messages_7d: messagesData.data?.length || 0,
          events_7d: eventsData.data?.length || 0,
          total_posts: totalPostsData.count || 0,
          total_comments: totalCommentsData.count || 0,
          total_connections: totalConnectionsData.count || 0,
          total_messages: totalMessagesData.count || 0,
          last_login: profileData?.last_seen_at,
          last_post: lastPost,
          last_comment: lastComment,
          last_connection: lastConnection,
          last_message: lastMessage,
          last_event: lastEvent
        }

        const score = calculateEngagementScore(metrics)
        const tier = determineEngagementTier(score, metrics.last_login)

        // Upsert engagement tracking data
        const { error: upsertError } = await supabase
          .from('user_engagement_tracking')
          .upsert({
            user_id: profile.id,
            last_login: metrics.last_login,
            last_post_created: metrics.last_post,
            last_comment_made: metrics.last_comment,
            last_connection_request: metrics.last_connection,
            last_message_sent: metrics.last_message,
            last_event_registered: metrics.last_event,
            total_posts: metrics.total_posts,
            total_comments: metrics.total_comments,
            total_connections: metrics.total_connections,
            total_messages_sent: metrics.total_messages,
            engagement_score: score,
            engagement_tier: tier,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })

        if (upsertError) {
          console.error(`Error updating engagement for user ${profile.id}:`, upsertError)
        } else {
          updatedCount++
        }

      } catch (userError) {
        console.error(`Error processing user ${profile.id}:`, userError)
      }
    }

    console.log(`Engagement tracking complete. Updated ${updatedCount} users.`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: profiles?.length || 0,
        updated: updatedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in engagement-tracker:', error)
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
