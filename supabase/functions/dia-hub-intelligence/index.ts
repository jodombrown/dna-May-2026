import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HubRequest {
  hub_type: 'region' | 'country';
  hub_slug: string;
  user_id?: string | null;
  feeds?: {
    connect?: { limit: number; offset?: number };
    convene?: { limit: number; offset?: number };
    collaborate?: { limit: number; offset?: number };
    contribute?: { limit: number; offset?: number };
    convey?: { limit: number; offset?: number };
  };
  include_metrics?: boolean;
  include_metadata?: boolean;
}

// Regional hub configurations with country mappings
const REGION_CONFIG: Record<string, {
  name: string;
  tagline: string;
  description_short: string;
  countries: { name: string; slug: string; flag_url: string }[];
}> = {
  'north-africa': {
    name: 'North Africa',
    tagline: 'Where ancient heritage meets modern innovation',
    description_short: 'Connect with the diaspora from Egypt, Morocco, Tunisia, Algeria, Libya, and Sudan. A region known for its rich history and emerging tech ecosystems.',
    countries: [
      { name: 'Egypt', slug: 'egypt', flag_url: 'https://flagcdn.com/w80/eg.png' },
      { name: 'Morocco', slug: 'morocco', flag_url: 'https://flagcdn.com/w80/ma.png' },
      { name: 'Tunisia', slug: 'tunisia', flag_url: 'https://flagcdn.com/w80/tn.png' },
      { name: 'Algeria', slug: 'algeria', flag_url: 'https://flagcdn.com/w80/dz.png' },
      { name: 'Libya', slug: 'libya', flag_url: 'https://flagcdn.com/w80/ly.png' },
      { name: 'Sudan', slug: 'sudan', flag_url: 'https://flagcdn.com/w80/sd.png' },
    ]
  },
  'west-africa': {
    name: 'West Africa',
    tagline: 'The heartbeat of African entrepreneurship',
    description_short: 'Connect with the vibrant diaspora from Nigeria, Ghana, Senegal, and beyond. Home to Africas largest economies and fastest-growing startup ecosystems.',
    countries: [
      { name: 'Nigeria', slug: 'nigeria', flag_url: 'https://flagcdn.com/w80/ng.png' },
      { name: 'Ghana', slug: 'ghana', flag_url: 'https://flagcdn.com/w80/gh.png' },
      { name: 'Senegal', slug: 'senegal', flag_url: 'https://flagcdn.com/w80/sn.png' },
      { name: 'Ivory Coast', slug: 'ivory-coast', flag_url: 'https://flagcdn.com/w80/ci.png' },
      { name: 'Cameroon', slug: 'cameroon', flag_url: 'https://flagcdn.com/w80/cm.png' },
      { name: 'Benin', slug: 'benin', flag_url: 'https://flagcdn.com/w80/bj.png' },
    ]
  },
  'east-africa': {
    name: 'East Africa',
    tagline: 'Innovation hub of the continent',
    description_short: 'Connect with diaspora from Kenya, Ethiopia, Tanzania, Rwanda, and Uganda. A region leading in mobile money, tech innovation, and sustainable development.',
    countries: [
      { name: 'Kenya', slug: 'kenya', flag_url: 'https://flagcdn.com/w80/ke.png' },
      { name: 'Ethiopia', slug: 'ethiopia', flag_url: 'https://flagcdn.com/w80/et.png' },
      { name: 'Tanzania', slug: 'tanzania', flag_url: 'https://flagcdn.com/w80/tz.png' },
      { name: 'Rwanda', slug: 'rwanda', flag_url: 'https://flagcdn.com/w80/rw.png' },
      { name: 'Uganda', slug: 'uganda', flag_url: 'https://flagcdn.com/w80/ug.png' },
      { name: 'Somalia', slug: 'somalia', flag_url: 'https://flagcdn.com/w80/so.png' },
    ]
  },
  'southern-africa': {
    name: 'Southern Africa',
    tagline: 'Gateway to African prosperity',
    description_short: 'Connect with diaspora from South Africa, Zimbabwe, Botswana, and beyond. A region with strong financial infrastructure and diverse opportunities.',
    countries: [
      { name: 'South Africa', slug: 'south-africa', flag_url: 'https://flagcdn.com/w80/za.png' },
      { name: 'Zimbabwe', slug: 'zimbabwe', flag_url: 'https://flagcdn.com/w80/zw.png' },
      { name: 'Botswana', slug: 'botswana', flag_url: 'https://flagcdn.com/w80/bw.png' },
      { name: 'Zambia', slug: 'zambia', flag_url: 'https://flagcdn.com/w80/zm.png' },
      { name: 'Mozambique', slug: 'mozambique', flag_url: 'https://flagcdn.com/w80/mz.png' },
      { name: 'Namibia', slug: 'namibia', flag_url: 'https://flagcdn.com/w80/na.png' },
    ]
  },
  'central-africa': {
    name: 'Central Africa',
    tagline: 'Heart of the continent',
    description_short: 'Connect with diaspora from DRC, Congo, CAR, and more. A region rich in natural resources and cultural heritage.',
    countries: [
      { name: 'DRC', slug: 'drc', flag_url: 'https://flagcdn.com/w80/cd.png' },
      { name: 'Congo', slug: 'congo', flag_url: 'https://flagcdn.com/w80/cg.png' },
      { name: 'Gabon', slug: 'gabon', flag_url: 'https://flagcdn.com/w80/ga.png' },
      { name: 'Chad', slug: 'chad', flag_url: 'https://flagcdn.com/w80/td.png' },
      { name: 'CAR', slug: 'car', flag_url: 'https://flagcdn.com/w80/cf.png' },
      { name: 'Equatorial Guinea', slug: 'equatorial-guinea', flag_url: 'https://flagcdn.com/w80/gq.png' },
    ]
  }
};

// Country configurations
const COUNTRY_CONFIG: Record<string, {
  name: string;
  tagline: string;
  description_short: string;
  description_full?: string;
}> = {
  'egypt': { name: 'Egypt', tagline: 'Land of the Pharaohs', description_short: 'Connect with the Egyptian diaspora worldwide.' },
  'morocco': { name: 'Morocco', tagline: 'Gateway to Africa', description_short: 'Connect with the Moroccan diaspora worldwide.' },
  'tunisia': { name: 'Tunisia', tagline: 'Cradle of the Arab Spring', description_short: 'Connect with the Tunisian diaspora worldwide.' },
  'algeria': { name: 'Algeria', tagline: 'Land of a Million Martyrs', description_short: 'Connect with the Algerian diaspora worldwide.' },
  'libya': { name: 'Libya', tagline: 'Pearl of the Mediterranean', description_short: 'Connect with the Libyan diaspora worldwide.' },
  'sudan': { name: 'Sudan', tagline: 'Land of the Nile', description_short: 'Connect with the Sudanese diaspora worldwide.' },
  'nigeria': { name: 'Nigeria', tagline: 'Giant of Africa', description_short: 'Connect with the Nigerian diaspora worldwide. Home to Africa\'s largest population and economy.' },
  'ghana': { name: 'Ghana', tagline: 'Gateway to Africa', description_short: 'Connect with the Ghanaian diaspora worldwide. The Year of Return destination.' },
  'senegal': { name: 'Senegal', tagline: 'Land of Teranga', description_short: 'Connect with the Senegalese diaspora worldwide.' },
  'kenya': { name: 'Kenya', tagline: 'Silicon Savannah', description_short: 'Connect with the Kenyan diaspora worldwide. East Africa\'s tech hub.' },
  'ethiopia': { name: 'Ethiopia', tagline: 'Land of Origins', description_short: 'Connect with the Ethiopian diaspora worldwide.' },
  'south-africa': { name: 'South Africa', tagline: 'Rainbow Nation', description_short: 'Connect with the South African diaspora worldwide.' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const body: HubRequest = await req.json();
    const { hub_type, hub_slug, feeds, include_metrics = true, include_metadata = true } = body;
    // Force user_id to the authenticated caller; ignore client-supplied value to prevent impersonation.
    const user_id = auth.userId;

    console.log(`Hub request: type=${hub_type}, slug=${hub_slug}, user=${user_id}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const response: any = {
      success: true,
      timestamp: new Date().toISOString(),
      cache_status: 'miss',
      personalization_tier: user_id ? 2 : 1,
      hub: {},
      feeds: {}
    };

    // Get hub metadata
    if (include_metadata) {
      if (hub_type === 'region') {
        const regionConfig = REGION_CONFIG[hub_slug];
        if (regionConfig) {
          response.hub.metadata = {
            id: hub_slug,
            name: regionConfig.name,
            slug: hub_slug,
            tagline: regionConfig.tagline,
            description_short: regionConfig.description_short,
            hero_image_url: '',
            countries: regionConfig.countries
          };
        }
      } else if (hub_type === 'country') {
        const countryConfig = COUNTRY_CONFIG[hub_slug];
        if (countryConfig) {
          response.hub.metadata = {
            id: hub_slug,
            name: countryConfig.name,
            slug: hub_slug,
            tagline: countryConfig.tagline,
            description_short: countryConfig.description_short,
            description_full: countryConfig.description_full,
            hero_image_url: ''
          };
        }
      }
    }

    // Get hub metrics
    if (include_metrics) {
      // Query for actual counts from database
      const { count: membersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true);

      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('date_time', new Date().toISOString());

      const { count: projectsCount } = await supabase
        .from('collaboration_spaces')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      response.hub.metrics = {
        members_connected: membersCount || 0,
        events_hosted: eventsCount || 0,
        projects_active: projectsCount || 0,
        contributions_total: 0,
        stories_published: 0
      };
    }

    // Get CONNECT feed (members)
    if (feeds?.connect) {
      const { limit = 6, offset = 0 } = feeds.connect;

      const { data: members, count } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, headline, location, skills, interests', { count: 'exact' })
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      response.feeds.connect = {
        items: members?.map((m) => ({
          id: m.id,
          display_name: m.full_name,
          username: m.username,
          avatar_url: m.avatar_url,
          headline: m.headline,
          location: m.location,
          expertise_areas: m.skills?.slice(0, 3) || [],
          interests: m.interests?.slice(0, 3) || [],
        })) || [],
        total: count || 0,
        has_more: (count || 0) > offset + limit,
      };
    }

    // Get CONVENE feed (events)
    if (feeds?.convene) {
      const { limit = 4, offset = 0 } = feeds.convene;

      const { data: events, count } = await supabase
        .from('events')
        .select('id, title, slug, type, date_time, location, cover_image_url', { count: 'exact' })
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .range(offset, offset + limit - 1);

      response.feeds.convene = {
        items: events?.map((e) => ({
          id: e.id,
          title: e.title,
          slug: e.slug,
          event_type: e.type,
          start_datetime: e.date_time,
          location_name: e.location,
          cover_image_url: e.cover_image_url,
          attendee_count: 0
        })) || [],
        total: count || 0,
        has_more: (count || 0) > offset + limit,
      };
    }

    // Get COLLABORATE feed (spaces/projects)
    if (feeds?.collaborate) {
      const { limit = 4, offset = 0 } = feeds.collaborate;

      const { data: spaces, count } = await supabase
        .from('collaboration_spaces')
        .select('id, name, slug, description, sector, stage', { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      response.feeds.collaborate = {
        items: spaces?.map((s) => ({
          id: s.id,
          title: s.name,
          slug: s.slug,
          sector: s.sector || 'General',
          stage: s.stage || 'Active',
          description_short: s.description?.substring(0, 150) || '',
          seeking_roles: [],
          team_size: 0
        })) || [],
        total: count || 0,
        has_more: (count || 0) > offset + limit,
      };
    }

    // Get CONTRIBUTE feed (opportunities)
    if (feeds?.contribute) {
      const { limit = 4, offset = 0 } = feeds.contribute;

      const { data: opportunities, count } = await supabase
        .from('opportunities')
        .select('id, title, slug, type, description, sector', { count: 'exact' })
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      response.feeds.contribute = {
        items: opportunities?.map((o) => ({
          id: o.id,
          title: o.title,
          slug: o.slug,
          type: o.type,
          description_short: o.description?.substring(0, 150) || '',
          sector: o.sector
        })) || [],
        total: count || 0,
        has_more: (count || 0) > offset + limit,
      };
    }

    // Get CONVEY feed (stories/content)
    if (feeds?.convey) {
      const { limit = 4, offset = 0 } = feeds.convey;

      const { data: posts, count } = await supabase
        .from('feed_posts')
        .select('id, content, created_at, author_id, like_count, comment_count', { count: 'exact' })
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      response.feeds.convey = {
        items: posts?.map((p) => ({
          id: p.id,
          excerpt: p.content?.substring(0, 200) || '',
          published_at: p.created_at,
          author_id: p.author_id,
          engagement: {
            likes: p.like_count || 0,
            comments: p.comment_count || 0
          }
        })) || [],
        total: count || 0,
        has_more: (count || 0) > offset + limit,
      };
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in dia-hub-intelligence:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
