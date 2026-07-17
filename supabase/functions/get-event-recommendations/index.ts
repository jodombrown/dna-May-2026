import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { requireUser, makeUserClient, callModel, writeEvent, modelFor } from '../_shared/dia-core/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();

    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;
    const userId = auth.userId;
    const supabaseClient = makeUserClient(auth.token);   // preserves all five .from reads under RLS
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    console.log('Fetching recommendations for user:', userId);

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('interests, interest_tags, current_country, location')
      .eq('id', userId)
      .single();

    // Get user's groups
    const { data: userGroups } = await supabaseClient
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    const groupIds = userGroups?.map(g => g.group_id) || [];

    // Get user's connections
    const { data: connections } = await supabaseClient
      .from('connections')
      .select('requester_id, recipient_id')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq('status', 'accepted');

    const connectionIds = connections?.map(c =>
      c.requester_id === userId ? c.recipient_id : c.requester_id
    ) || [];

    // Get upcoming events
    const { data: events } = await supabaseClient
      .from('events')
      .select('id, title, description, event_type, format, location_city, location_country, start_time')
      .gte('start_time', new Date().toISOString())
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('start_time')
      .limit(50);

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get attendees for each event to calculate social proof
    const { data: allAttendees } = await supabaseClient
      .from('event_attendees')
      .select('event_id, user_id')
      .in('event_id', events.map(e => e.id))
      .eq('status', 'going');

    const attendeesByEvent = allAttendees?.reduce((acc, a) => {
      if (!acc[a.event_id]) acc[a.event_id] = [];
      acc[a.event_id].push(a.user_id);
      return acc;
    }, {} as Record<string, string[]>) || {};

    // Use the DIA model spine to score and rank events
    const systemPrompt = `You are an intelligent event recommendation system for the Diaspora Network of Africa (DNA). 
Your task is to analyze events and user profiles to recommend the most relevant events.

Consider:
- User's interests and tags
- User's location vs event location (prefer local or virtual events)
- Event type alignment with user preferences
- Social connections attending (higher priority if friends are going)
- Group membership (higher priority for group-hosted events user is part of)

Return recommendations as a structured list with reasoning.`;

    const userPrompt = `User Profile:
- Interests: ${profile?.interests?.join(', ') || 'None'}
- Tags: ${profile?.interest_tags?.join(', ') || 'None'}
- Location: ${profile?.current_country || profile?.location || 'Unknown'}
- Groups: ${groupIds.length} groups
- Connections: ${connectionIds.length} connections

Events to score (${events.length} total):
${events.map((e, i) => {
  const attendees = attendeesByEvent[e.id] || [];
  const friendsGoing = attendees.filter(a => connectionIds.includes(a)).length;
  return `${i + 1}. "${e.title}" (${e.event_type}, ${e.format})
   - Location: ${e.location_city || 'Virtual'}, ${e.location_country || ''}
   - Date: ${e.start_time}
   - Friends attending: ${friendsGoing}
   - Description: ${e.description?.substring(0, 150)}...`;
}).join('\n')}

Recommend the top 10 events with scores and brief reasoning.`;

    let result;
    try {
      result = await callModel({
        capability: 'event_recommendations',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'recommend_events',
            description: 'Return ranked event recommendations with scores',
            parameters: {
              type: 'object',
              properties: {
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      event_index: { type: 'number' },
                      score: { type: 'number', description: 'Score from 0-100' },
                      reasoning: { type: 'string' }
                    },
                    required: ['event_index', 'score', 'reasoning']
                  }
                }
              },
              required: ['recommendations']
            }
          }
        }],
        toolChoice: { type: 'function', function: { name: 'recommend_events' } },
      });
    } catch (modelError) {
      console.error('Model error:', modelError);
      await writeEvent(admin, {
        userId, capability: 'event_recommendations', surface: 'get-event-recommendations',
        provider: 'gemini', model: modelFor('event_recommendations'), success: false,
        latencyMs: Date.now() - startTime, errorCode: 'model_unavailable',
        errorMessage: (modelError instanceof Error ? modelError.message : String(modelError)).slice(0, 300),
      });
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const toolCall = result.message?.tool_calls?.[0];

    if (!toolCall) {
      console.error('No tool call in AI response');
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiRecommendations = JSON.parse(toolCall.function.arguments).recommendations;

    // Map AI recommendations back to events with social proof
    const recommendations = aiRecommendations
      .slice(0, 10)
      .map((rec: any) => {
        const event = events[rec.event_index - 1];
        if (!event) return null;
        const attendees = attendeesByEvent[event.id] || [];
        const friendsGoing = attendees.filter(a => connectionIds.includes(a));
        
        return {
          ...event,
          recommendation_score: rec.score,
          recommendation_reason: rec.reasoning,
          friends_attending_count: friendsGoing.length,
          total_attendees: attendees.length
        };
      })
      .filter(Boolean);

    await writeEvent(admin, {
      userId, capability: 'event_recommendations', surface: 'get-event-recommendations',
      provider: result.provider, model: result.model, success: true,
      latencyMs: Date.now() - startTime, tokens: result.tokens,
      meta: { events_scored: events.length },
    });

    console.log(`Generated ${recommendations.length} recommendations for user ${userId}`);

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-event-recommendations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
