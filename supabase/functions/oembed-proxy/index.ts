import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers - allow public access for embed fetching
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Basic HTML sanitizer to reduce XSS risk from provider HTML
function sanitizeHtml(input?: string): string | undefined {
  if (!input) return input;
  let out = input;
  // Remove script tags completely
  out = out.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  // Remove inline event handlers like onload=, onclick=
  out = out.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // Disallow javascript: URLs
  out = out.replace(/javascript:/gi, "");
  // Harden iframes: add sandbox and referrerpolicy
  out = out.replace(/<iframe(\s+)/gi, '<iframe sandbox="allow-same-origin allow-scripts" referrerpolicy="no-referrer" $1');
  return out;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Support both GET ?url=... and POST { url }
    const requestUrl = new URL(req.url)
    let targetUrl = requestUrl.searchParams.get('url')

    if (!targetUrl && req.method === 'POST') {
      try {
        const body = await req.json();
        targetUrl = body?.url;
      } catch {
        // ignore JSON parse errors; handled by validation below
      }
    }

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate URL format
    try {
      new URL(targetUrl)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Try noembed.com first (supports many providers)
    const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(targetUrl)}`
    
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'DNA Platform/1.0 (diasporanetwork.africa)',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`oEmbed service error: ${response.status}`)
    }

    const data = await response.json()

    // Sanitize provider HTML if present
    if (typeof data?.html === 'string') {
      data.html = sanitizeHtml(data.html)
    }

    // Add our own metadata
    const enrichedData = {
      ...data,
      fetched_at: new Date().toISOString(),
      cache_age: data.cache_age || 86400 // Default 24 hours
    }

    return new Response(
      JSON.stringify(enrichedData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      }
    )

  } catch (error) {
    console.error('oEmbed proxy error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred. Please try again.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})