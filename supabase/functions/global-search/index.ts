import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GlobalSearchResult {
  title: string;
  description: string;
  url?: string;
  source: string;
  relevanceScore: number;
  type?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client (service role; gated on caller auth below)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Require authenticated caller
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // User-scoped client so RLS applies for community_posts / events visibility
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { query, searchType = 'web' } = await req.json();

    console.log(`Global search request: ${query}, type: ${searchType}`);

    // Perform hybrid search: database + real-time web search
    const [databaseResults, webResults] = await Promise.all([
      performDynamicSearch(supabase, userClient, query, searchType),
      performWebSearch(query, searchType)
    ]);
    
    // Combine and rank results
    const combinedResults = [...databaseResults, ...webResults];
    const rankedResults = await rankSearchResults(combinedResults, query);
    
    // Return enhanced response with source tracking
    return new Response(JSON.stringify({
      query,
      searchType,
      results: rankedResults.slice(0, 20),
      suggestions: await generateAISuggestions(query),
      totalResults: combinedResults.length,
      sources: {
        database: databaseResults.length,
        web: webResults.length
      },
      status: {
        perplexityAvailable: !!perplexityApiKey,
        openaiAvailable: !!openAIApiKey
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in global-search function:', error);
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function performDynamicSearch(supabase: any, query: string, searchType: string): Promise<GlobalSearchResult[]> {
  const results: GlobalSearchResult[] = [];
  const searchTerm = `%${query.toLowerCase()}%`;
  
  try {
    // Search People/Profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, bio, professional_role, location, avatar_url')
      .or(`full_name.ilike.${searchTerm},display_name.ilike.${searchTerm},bio.ilike.${searchTerm},professional_role.ilike.${searchTerm}`)
      .eq('is_public', true)
      .limit(5);

    if (profiles) {
      profiles.forEach((profile: any) => {
        results.push({
          title: profile.display_name || profile.full_name || 'DNA Member',
          description: `${profile.professional_role || 'Professional'} ${profile.location ? `in ${profile.location}` : ''}. ${profile.bio || 'DNA Community Member'}`,
          url: `/app/profile?id=${profile.id}`,
          source: 'DNA Profiles',
          relevanceScore: 0.9,
          type: 'people'
        });
      });
    }

    // Search Events
    const { data: events } = await supabase
      .from('events')
      .select('id, title, description, location, date_time, type')
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},location.ilike.${searchTerm}`)
      .gte('date_time', new Date().toISOString())
      .limit(5);

    if (events) {
      events.forEach((event: any) => {
        results.push({
          title: event.title,
          description: `${event.type} event ${event.location ? `in ${event.location}` : ''}. ${event.description || 'Join the DNA community'}`,
          url: `/app/events?id=${event.id}`,
          source: 'DNA Events',
          relevanceScore: 0.85,
          type: 'events'
        });
      });
    }

    // Search Communities/Organizations
    const { data: communities } = await supabase
      .from('communities')
      .select('id, name, description, category, member_count')
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`)
      .eq('is_active', true)
      .limit(5);

    if (communities) {
      communities.forEach((community: any) => {
        results.push({
          title: community.name,
          description: `${community.category} community with ${community.member_count} members. ${community.description || 'Connect and collaborate'}`,
          url: `/app/communities?id=${community.id}`,
          source: 'DNA Communities',
          relevanceScore: 0.8,
          type: 'organizations'
        });
      });
    }

    // Search Projects/Opportunities
    const { data: projects } = await supabase
      .from('projects')
      .select('id, title, description, category, status')
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`)
      .eq('status', 'active')
      .limit(5);

    if (projects) {
      projects.forEach((project: any) => {
        results.push({
          title: project.title,
          description: `${project.category} opportunity. ${project.description || 'Collaborate on this DNA project'}`,
          url: `/projects/${project.id}`,
          source: 'DNA Projects',
          relevanceScore: 0.75,
          type: 'opportunities'
        });
      });
    }

    // Search Posts/News
    const { data: posts } = await supabase
      .from('community_posts')
      .select('id, title, content, created_at, community_id')
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (posts) {
      posts.forEach((post: any) => {
        results.push({
          title: post.title || 'Community Discussion',
          description: `${post.content?.substring(0, 120) || 'Join the conversation'}...`,
          url: `/app/communities?id=${post.community_id}`,
          source: 'DNA Posts',
          relevanceScore: 0.7,
          type: 'news'
        });
      });
    }

    console.log(`Found ${results.length} database results for query: ${query}`);
    
  } catch (error) {
    console.error('Error in database search:', error);
  }

  return results;
}

// Real-time web search using Perplexity AI
async function performWebSearch(query: string, searchType: string): Promise<GlobalSearchResult[]> {
  if (!perplexityApiKey) {
    console.log('Perplexity API key not found, skipping web search');
    return [];
  }

  try {
    console.log(`Performing Perplexity web search for: ${query}`);
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: `You are helping search for real, current information related to: ${query}. 
            Focus on finding actual, recent, and verifiable information about:
            - Real companies, organizations, and people
            - Actual events, conferences, and opportunities  
            - Current news and developments
            - Legitimate investment opportunities
            
            Return specific, factual results with sources. Do not make up or invent information.
            Format your response as a structured list with titles, descriptions, and URLs where available.`
          },
          {
            role: 'user',
            content: `Find real, current information about: ${query}`
          }
        ],
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 1000,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      console.error(`Perplexity API error: ${response.status} - ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    console.log('Perplexity response:', JSON.stringify(data, null, 2));
    
    const searchResults = data.choices?.[0]?.message?.content;

    if (searchResults) {
      const webResults = parseWebSearchResults(searchResults, query);
      console.log(`Found ${webResults.length} web results`);
      return webResults;
    }

    return [];
  } catch (error) {
    console.error('Perplexity search error:', error);
    return [];
  }
}

// Parse AI search response into structured results
function parseWebSearchResults(content: string, originalQuery: string): GlobalSearchResult[] {
  const results: GlobalSearchResult[] = [];
  
  try {
    // Split content into sections and look for structured information
    const lines = content.split('\n').filter(line => line.trim());
    
    let currentResult: Partial<GlobalSearchResult> = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and very short content
      if (!trimmedLine || trimmedLine.length < 10) continue;
      
      // Look for URLs
      const urlMatch = trimmedLine.match(/(https?:\/\/[^\s\)]+)/);
      if (urlMatch) {
        currentResult.url = urlMatch[1];
      }
      
      // Look for titles (usually bold, numbered, or in specific patterns)
      if (
        (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) ||
        /^\d+\.\s/.test(trimmedLine) ||
        (trimmedLine.length > 10 && trimmedLine.length < 100 && !trimmedLine.includes('http'))
      ) {
        if (!currentResult.title) {
          currentResult.title = trimmedLine.replace(/[*#\d\.]/g, '').trim();
        }
      }
      
      // Look for descriptions (longer lines)
      if (trimmedLine.length > 50 && trimmedLine.length < 300 && !trimmedLine.includes('http')) {
        if (!currentResult.description) {
          currentResult.description = trimmedLine.replace(/[*#]/g, '').trim();
        }
      }
      
      // If we have enough info, save the result
      if (currentResult.title && currentResult.description) {
        results.push({
          title: currentResult.title,
          description: currentResult.description,
          url: currentResult.url || '#',
          source: 'Web Search (Perplexity)',
          relevanceScore: 0.7,
          type: inferContentType(currentResult.title + ' ' + currentResult.description)
        });
        
        currentResult = {}; // Reset for next result
        
        if (results.length >= 8) break; // Limit web results
      }
    }
  } catch (error) {
    console.error('Error parsing web search results:', error);
  }

  return results;
}

// Infer content type from title and description
function inferContentType(text: string): string {
  const lower = text.toLowerCase();
  
  if (lower.includes('event') || lower.includes('conference') || lower.includes('summit') || lower.includes('meetup')) {
    return 'events';
  }
  if (lower.includes('company') || lower.includes('organization') || lower.includes('startup')) {
    return 'organizations';
  }
  if (lower.includes('job') || lower.includes('opportunity') || lower.includes('hiring') || lower.includes('career')) {
    return 'opportunities';
  }
  if (lower.includes('news') || lower.includes('article') || lower.includes('report')) {
    return 'news';
  }
  
  return 'general';
}

// Rank search results using AI-powered relevance scoring
async function rankSearchResults(results: GlobalSearchResult[], query: string): Promise<GlobalSearchResult[]> {
  if (!openAIApiKey || results.length === 0) {
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Score each result from 0.0 to 1.0 based on relevance to the query. Return only a JSON array of scores: [0.95, 0.8, ...]`
          },
          {
            role: 'user',
            content: `Query: "${query}"\n\nResults:\n${results.map((r, i) => `${i+1}. ${r.title}: ${r.description}`).join('\n')}`
          }
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    const scoresText = data.choices?.[0]?.message?.content;
    
    if (scoresText) {
      try {
        const scores = JSON.parse(scoresText);
        if (Array.isArray(scores) && scores.length === results.length) {
          results.forEach((result, index) => {
            result.relevanceScore = scores[index] || result.relevanceScore;
          });
        }
      } catch (e) {
        console.error('Failed to parse relevance scores:', e);
      }
    }
  } catch (error) {
    console.error('AI ranking error:', error);
  }

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Generate AI-powered search suggestions
async function generateAISuggestions(query: string): Promise<string[]> {
  if (!openAIApiKey) {
    return [
      `${query} professionals`,
      `${query} events`,
      `${query} organizations`,
      `${query} opportunities`,
      "African professionals",
      "Networking events"
    ];
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Generate 6 realistic search suggestions related to the query. Return only a JSON array: ["suggestion 1", "suggestion 2", ...]`
          },
          {
            role: 'user',
            content: `Original query: "${query}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    const suggestionsText = data.choices?.[0]?.message?.content;
    
    if (suggestionsText) {
      try {
        const suggestions = JSON.parse(suggestionsText);
        if (Array.isArray(suggestions)) {
          return suggestions.slice(0, 6);
        }
      } catch (e) {
        console.error('Failed to parse AI suggestions:', e);
      }
    }
  } catch (error) {
    console.error('AI suggestions error:', error);
  }

  // Fallback suggestions
  return [
    `${query} professionals`,
    `${query} events`, 
    `${query} organizations`,
    `${query} opportunities`,
    "African professionals",
    "Networking events"
  ];
}