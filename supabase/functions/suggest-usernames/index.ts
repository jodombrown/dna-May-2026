import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";
import { requireUser } from "../_shared/auth.ts";
import { callModel, writeEvent, modelFor } from '../_shared/dia-core/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const __auth = await requireUser(req);
  if (!__auth.ok) return __auth.response;

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const startTime = Date.now();

    const { fullName, industry, countryOrigin, currentLocation } = await req.json();

    // Create focused, name-based prompt for username suggestions
    const prompt = `Generate 8 short, clean username suggestions based ONLY on this person's name.

Name: ${fullName}
Industry (for context only, do not include in usernames): ${industry || 'Professional'}
Country of Origin (for context only, do not include in usernames): ${countryOrigin || 'Africa'}
Current Location (for context only, do not include in usernames): ${currentLocation || 'Global'}

Rules:
- Usernames must be between 3 and 20 characters
- Use only lowercase letters, numbers, dots (.), underscores (_) or hyphens (-)
- Base every suggestion on variations of their first and/or last name (e.g. denacia, denacia_o, d_okoro, denaciaokoro, denacia01)
- You may use initials and simple numbers, but DO NOT add extra words like "pro", "diaspora", "connects", job titles, industries, countries, or slogans
- Do not include references to Africa, diaspora, locations, or professions in the username itself
- All usernames should feel like natural, name-based handles that the person could realistically choose

Return ONLY a JSON array of objects with this exact format:
[
  {
    "username": "suggested_username",
    "explanation": "Very short note about how this relates to their name"
  }
]`;

    console.log('Generating username suggestions for:', { fullName, industry, countryOrigin });

    let result;
    try {
      result = await callModel({
        capability: 'suggest_usernames',
        messages: [
          {
            role: 'system',
            content: 'You are a creative username generator specializing in African diaspora professional identity. Generate meaningful, culturally-aware username suggestions. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      });
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      console.error('Model error in suggest-usernames:', msg);
      await writeEvent(admin, { userId: __auth.userId, capability: 'suggest_usernames', surface: 'suggest-usernames',
        provider: 'gemini', model: modelFor('suggest_usernames'), success: false, latencyMs: Date.now() - startTime,
        errorCode: msg.includes('429') ? 'rate_limited' : msg.includes('402') ? 'payment_required' : 'model_unavailable' });
      if (msg.includes('429')) return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.', suggestions: [] }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (msg.includes('402')) return new Response(JSON.stringify({ error: 'AI service unavailable, please try again later.', suggestions: [] }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw e;
    }

    const suggestions = result.message?.content;

    if (!suggestions) {
      throw new Error('No suggestions generated');
    }

    // Parse the JSON response
    let parsedSuggestions;
    try {
      // Clean up response - remove markdown code blocks if present
      let cleanedSuggestions = suggestions.trim();
      if (cleanedSuggestions.startsWith('```json')) {
        cleanedSuggestions = cleanedSuggestions.slice(7);
      }
      if (cleanedSuggestions.startsWith('```')) {
        cleanedSuggestions = cleanedSuggestions.slice(3);
      }
      if (cleanedSuggestions.endsWith('```')) {
        cleanedSuggestions = cleanedSuggestions.slice(0, -3);
      }
      parsedSuggestions = JSON.parse(cleanedSuggestions.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', suggestions);
      // Fallback suggestions if AI response is malformed
      const safeName = (fullName || 'member').toLowerCase().trim();
      const parts = safeName.split(/\s+/);
      const first = parts[0] || 'member';
      const last = parts.length > 1 ? parts[parts.length - 1] : '';

      const handle1 = (first + (last ? last[0] : '')).replace(/[^a-z0-9]/g, '').slice(0, 15);
      const handle2 = (first + (last ? `_${last}` : '')).replace(/[^a-z0-9_]/g, '').slice(0, 18);
      const handle3 = `${first.replace(/[^a-z0-9]/g, '').slice(0, 12)}${Math.floor(Math.random() * 90 + 10)}`;
      const base = safeName.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '').slice(0, 16) || 'member01';

      parsedSuggestions = [
        {
          username: handle1 || base,
          explanation: "Based on your first and last name"
        },
        {
          username: handle2 || base,
          explanation: "Simple variation of your name"
        },
        {
          username: handle3,
          explanation: "Name-based handle with a short number"
        }
      ];
    }

    console.log('Generated suggestions:', parsedSuggestions);

    await writeEvent(admin, { userId: __auth.userId, capability: 'suggest_usernames', surface: 'suggest-usernames',
      provider: result.provider, model: result.model, success: true, latencyMs: Date.now() - startTime, tokens: result.tokens });

    return new Response(
      JSON.stringify({ suggestions: parsedSuggestions }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('Error in suggest-usernames function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        suggestions: [] 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
})
