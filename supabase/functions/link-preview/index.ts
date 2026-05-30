import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { isSafePublicUrl } from "../_shared/auth.ts"

/**
 * DNA Link Preview Edge Function
 * 
 * Fetches metadata from URLs to generate rich link previews (LinkedIn-style).
 * Uses multiple strategies:
 * 1. oEmbed for supported providers (YouTube, Vimeo, Twitter, etc.)
 * 2. Open Graph / Twitter Card meta tag extraction for all other URLs
 * 3. Fallback to basic HTML parsing (title, description, favicon)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface LinkPreviewData {
  url: string;
  type: 'article' | 'video' | 'image' | 'website' | 'rich';
  title?: string;
  description?: string;
  image?: string;
  site_name?: string;
  author?: string;
  favicon?: string;
  // Video-specific
  embed_html?: string;
  video_url?: string;
  thumbnail_url?: string;
  provider_name?: string;
  // Metadata
  fetched_at: string;
}

// Known video providers that should use oEmbed
const VIDEO_PROVIDERS = [
  { pattern: /youtube\.com|youtu\.be/i, name: 'YouTube' },
  { pattern: /vimeo\.com/i, name: 'Vimeo' },
  { pattern: /twitter\.com\/.*\/video|x\.com\/.*\/video/i, name: 'Twitter' },
  { pattern: /tiktok\.com/i, name: 'TikTok' },
];

function isVideoProvider(url: string): { isVideo: boolean; provider?: string } {
  for (const { pattern, name } of VIDEO_PROVIDERS) {
    if (pattern.test(url)) {
      return { isVideo: true, provider: name };
    }
  }
  return { isVideo: false };
}

// Extract YouTube video ID and thumbnail
function getYouTubeThumbnail(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?#]+)/,
    /youtube\.com\/shorts\/([^&\s?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return null;
}

// Fetch oEmbed data for video providers
async function fetchOEmbed(url: string): Promise<Partial<LinkPreviewData> | null> {
  try {
    const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'DNA Platform/1.0 (diasporanetwork.africa)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.error) return null;

    // Sanitize HTML
    let html = data.html;
    if (html) {
      html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
      html = html.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
      html = html.replace(/javascript:/gi, "");
    }

    return {
      type: 'video',
      title: data.title,
      author: data.author_name,
      provider_name: data.provider_name,
      thumbnail_url: data.thumbnail_url,
      embed_html: html,
      site_name: data.provider_name,
    };
  } catch (error) {
    console.error('oEmbed fetch error:', error);
    return null;
  }
}

// Fetch and parse Open Graph / Twitter Card meta tags
async function fetchOpenGraph(url: string): Promise<Partial<LinkPreviewData>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DNABot/1.0; +https://diasporanetwork.africa)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      // It's not HTML, might be an image or other file
      if (contentType.startsWith('image/')) {
        return { type: 'image', image: url };
      }
      return {};
    }

    const html = await response.text();
    const result: Partial<LinkPreviewData> = {};

    // Parse meta tags using regex (Deno edge functions don't have full DOM)
    const getMeta = (property: string): string | undefined => {
      // Try og:, twitter:, and standard meta
      const patterns = [
        new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:|twitter:)?${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:|twitter:)?${property}["']`, 'i'),
      ];
      
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) return match[1];
      }
      return undefined;
    };

    // Open Graph
    result.title = getMeta('title') || getMeta('og:title') || getMeta('twitter:title');
    result.description = getMeta('description') || getMeta('og:description') || getMeta('twitter:description');
    result.image = getMeta('image') || getMeta('og:image') || getMeta('twitter:image');
    result.site_name = getMeta('site_name') || getMeta('og:site_name');
    result.author = getMeta('author') || getMeta('article:author');
    
    // Determine type
    const ogType = getMeta('type') || getMeta('og:type');
    if (ogType === 'article') {
      result.type = 'article';
    } else if (ogType === 'video' || ogType === 'video.other') {
      result.type = 'video';
    } else {
      result.type = 'website';
    }

    // Fallback: Extract title from <title> tag
    if (!result.title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        result.title = titleMatch[1].trim();
      }
    }

    // Extract favicon
    const faviconPatterns = [
      /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
    ];
    for (const pattern of faviconPatterns) {
      const match = html.match(pattern);
      if (match) {
        let favicon = match[1];
        // Convert relative URLs to absolute
        if (favicon.startsWith('/')) {
          const urlObj = new URL(url);
          favicon = `${urlObj.origin}${favicon}`;
        } else if (!favicon.startsWith('http')) {
          const urlObj = new URL(url);
          favicon = `${urlObj.origin}/${favicon}`;
        }
        result.favicon = favicon;
        break;
      }
    }
    
    // Fallback favicon
    if (!result.favicon) {
      const urlObj = new URL(url);
      result.favicon = `${urlObj.origin}/favicon.ico`;
    }

    // Make image URL absolute if relative
    if (result.image && !result.image.startsWith('http')) {
      const urlObj = new URL(url);
      result.image = result.image.startsWith('/')
        ? `${urlObj.origin}${result.image}`
        : `${urlObj.origin}/${result.image}`;
    }

    return result;
  } catch (error) {
    console.error('Open Graph fetch error:', error);
    // Return basic info from URL
    try {
      const urlObj = new URL(url);
      return {
        site_name: urlObj.hostname.replace('www.', ''),
        favicon: `${urlObj.origin}/favicon.ico`,
      };
    } catch {
      return {};
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get URL from request
    const requestUrl = new URL(req.url);
    let targetUrl = requestUrl.searchParams.get('url');

    if (!targetUrl && req.method === 'POST') {
      try {
        const body = await req.json();
        targetUrl = body?.url;
      } catch {
        // ignore
      }
    }

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SSRF guard: reject non-https or private/internal targets
    if (!isSafePublicUrl(targetUrl)) {
      return new Response(
        JSON.stringify({ error: 'URL not allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[link-preview] Fetching preview for: ${targetUrl}`);

    const { isVideo, provider } = isVideoProvider(targetUrl);
    let previewData: LinkPreviewData = {
      url: targetUrl,
      type: 'website',
      fetched_at: new Date().toISOString(),
    };

    // Strategy 1: For video providers, try oEmbed first
    if (isVideo) {
      console.log(`[link-preview] Detected video provider: ${provider}`);
      const oembedData = await fetchOEmbed(targetUrl);
      if (oembedData) {
        previewData = { ...previewData, ...oembedData, type: 'video' };
        
        // Add YouTube thumbnail if missing
        if (!previewData.thumbnail_url && provider === 'YouTube') {
          previewData.thumbnail_url = getYouTubeThumbnail(targetUrl) || undefined;
        }
      }
    }

    // Strategy 2: Fetch Open Graph data (for all URLs, as fallback or primary)
    if (!previewData.title) {
      console.log('[link-preview] Fetching Open Graph data...');
      const ogData = await fetchOpenGraph(targetUrl);
      previewData = { ...previewData, ...ogData };
    }

    // For video providers, ensure we have thumbnail
    if (isVideo && !previewData.thumbnail_url && !previewData.image) {
      if (provider === 'YouTube') {
        previewData.thumbnail_url = getYouTubeThumbnail(targetUrl) || undefined;
        previewData.image = previewData.thumbnail_url;
      }
    }

    // Use image as thumbnail for videos if no thumbnail
    if (previewData.type === 'video' && !previewData.thumbnail_url && previewData.image) {
      previewData.thumbnail_url = previewData.image;
    }

    // Final safety: only treat as video for known video providers
    // Some sites incorrectly label pages as "video" via og:type without actually being videos.
    // To avoid showing a play button on regular articles/websites, downgrade these to article/website.
    if (previewData.type === 'video' && !isVideo) {
      previewData.type = previewData.description ? 'article' : 'website';
    }

    // Ensure site_name fallback
    if (!previewData.site_name) {
      previewData.site_name = parsedUrl.hostname.replace('www.', '');
    }

    console.log('[link-preview] Success:', {
      url: previewData.url,
      type: previewData.type,
      title: previewData.title?.substring(0, 50),
      hasImage: !!previewData.image,
    });

    return new Response(
      JSON.stringify(previewData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      }
    );

  } catch (error) {
    console.error('[link-preview] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred. Please try again.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
