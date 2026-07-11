// DIA platform tools — server-side, RLS-safe.
// Each tool builds its own Supabase client bound to the caller's JWT so
// auth.uid() resolves and every RLS policy still applies. No service role.

// deno-lint-ignore-file no-explicit-any
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const ROW_CAP = 20;

export interface ToolContext {
  userId: string;
  supabase: SupabaseClient; // caller-scoped (JWT in headers)
}

export function makeUserClient(accessToken: string): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// -------- Result accumulators --------
export interface AggregatedResults {
  profiles: any[];
  events: any[];
  projects: any[];
  hashtags: any[];
  opportunities: any[];
  stories: any[];
  analytics?: any;
}

export function emptyResults(): AggregatedResults {
  return { profiles: [], events: [], projects: [], hashtags: [], opportunities: [], stories: [] };
}

// -------- Tool schemas (OpenAI-compat JSON Schema) --------
export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "search_my_network",
      description:
        "Find people already in the user's accepted connections. Use for questions like 'who in my network...', 'my connections in X sector', 'friends who joined Y'.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text keywords (headline, bio, skills, location)." },
          location: { type: "string", description: "Optional city/region/country filter." },
          industry: { type: "string", description: "Optional industry filter." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_platform_people",
      description:
        "Find ANY public members on the platform matching filters. Use for open lookups like 'artisans in Kenya', 'farmers in North America', 'fintech founders in Ghana'.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text keywords across headline/bio/skills/industry." },
          location: { type: "string" },
          industry: { type: "string" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recent_convene_joins",
      description:
        "List people from my network who recently RSVP'd/joined an event on Convene. Answers 'who in my network just joined Convene?'",
      parameters: {
        type: "object",
        properties: {
          since_days: { type: "number", description: "Look-back window in days. Default 14." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_events",
      description:
        "Search upcoming DNA events by topic/keyword/location. Use for 'events about X', 'upcoming events in Lagos', etc.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          location: { type: "string" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_spaces",
      description:
        "Find collaboration spaces (projects) the user is a member of, optionally filtered by keyword or status.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          status: { type: "string", description: "e.g. 'active', 'archived'" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_opportunities",
      description:
        "Search open contribution needs (Contribute hub). Use for 'opportunities in X sector', 'needs in Kenya', etc.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          region: { type: "string" },
          focus_area: { type: "string" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "my_post_analytics",
      description:
        "Return view/engagement counts for posts the current user authored over the past N days. Use for 'how many people viewed my posts', 'engagement on my recent post', etc.",
      parameters: {
        type: "object",
        properties: {
          since_days: { type: "number", description: "Look-back window in days. Default 30." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_stories_and_posts",
      description:
        "Search public posts and stories on Convey by topic or keyword.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          since_days: { type: "number", description: "Optional look-back window. Default 90." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the OPEN WEB via Perplexity for macro news, external facts, or anything not stored in DNA. Do NOT use for questions about the user's network, posts, events, or platform members.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          recency: { type: "string", enum: ["day", "week", "month", "year"], description: "Optional recency filter." },
        },
        required: ["query"],
      },
    },
  },
];

// -------- Tool implementations --------
export async function executeTool(
  name: string,
  args: any,
  ctx: ToolContext,
  webCitations: string[],
): Promise<{ text: string; results: Partial<AggregatedResults> }> {
  const { supabase, userId } = ctx;

  try {
    switch (name) {
      case "search_my_network": {
        // Get accepted connection user IDs
        const { data: conns } = await supabase
          .from("connections")
          .select("requester_id, recipient_id")
          .eq("status", "accepted")
          .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
          .limit(500);
        const ids = (conns ?? [])
          .map((c: any) => (c.requester_id === userId ? c.recipient_id : c.requester_id))
          .filter(Boolean);
        if (ids.length === 0) return { text: JSON.stringify({ profiles: [] }), results: {} };

        let q = supabase.from("profiles").select("id, full_name, headline, avatar_url, location, industry, skills").in("id", ids);
        if (args.location) q = q.ilike("location", `%${args.location}%`);
        if (args.industry) q = q.ilike("industry", `%${args.industry}%`);
        if (args.query) {
          const k = String(args.query).trim();
          q = q.or(`headline.ilike.%${k}%,bio.ilike.%${k}%,full_name.ilike.%${k}%`);
        }
        const { data } = await q.limit(ROW_CAP);
        const profiles = (data ?? []).map((p: any) => ({
          id: p.id,
          full_name: p.full_name ?? "DNA Member",
          headline: p.headline ?? "",
          avatar_url: p.avatar_url ?? "",
          location: p.location,
          skills: p.skills,
          relevance: "In your network",
        }));
        return { text: JSON.stringify({ count: profiles.length, profiles: profiles.slice(0, 8) }), results: { profiles } };
      }

      case "search_platform_people": {
        let q = supabase
          .from("profiles")
          .select("id, full_name, headline, avatar_url, location, industry, skills")
          .eq("is_public", true);
        if (args.location) q = q.ilike("location", `%${args.location}%`);
        if (args.industry) q = q.ilike("industry", `%${args.industry}%`);
        if (args.query) {
          const k = String(args.query).trim();
          q = q.or(`headline.ilike.%${k}%,bio.ilike.%${k}%,full_name.ilike.%${k}%`);
        }
        const { data } = await q.limit(ROW_CAP);
        const profiles = (data ?? []).map((p: any) => ({
          id: p.id,
          full_name: p.full_name ?? "DNA Member",
          headline: p.headline ?? "",
          avatar_url: p.avatar_url ?? "",
          location: p.location,
          skills: p.skills,
          relevance: "Platform match",
        }));
        return { text: JSON.stringify({ count: profiles.length, profiles: profiles.slice(0, 8) }), results: { profiles } };
      }

      case "recent_convene_joins": {
        const since = new Date(Date.now() - (args.since_days ?? 14) * 86400_000).toISOString();
        const { data: conns } = await supabase
          .from("connections")
          .select("requester_id, recipient_id")
          .eq("status", "accepted")
          .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
          .limit(500);
        const netIds = (conns ?? [])
          .map((c: any) => (c.requester_id === userId ? c.recipient_id : c.requester_id))
          .filter(Boolean);
        if (netIds.length === 0) return { text: JSON.stringify({ joins: [], note: "You have no accepted connections yet." }), results: {} };

        const { data: rsvps } = await supabase
          .from("event_attendees")
          .select("user_id, event_id, created_at, events(id, title, start_time)")
          .in("user_id", netIds)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(ROW_CAP);
        const rows = rsvps ?? [];
        const profileIds = Array.from(new Set(rows.map((r: any) => r.user_id)));
        const { data: profs } = profileIds.length
          ? await supabase.from("profiles").select("id, full_name, headline, avatar_url, location").in("id", profileIds)
          : { data: [] as any[] };
        const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
        const profiles = rows.map((r: any) => {
          const p = profMap.get(r.user_id) ?? {};
          return {
            id: r.user_id,
            full_name: p.full_name ?? "DNA Member",
            headline: p.headline ?? "",
            avatar_url: p.avatar_url ?? "",
            location: p.location,
            relevance: `RSVP'd ${new Date(r.created_at).toLocaleDateString()}: ${r.events?.title ?? "an event"}`,
          };
        });
        const events = rows
          .filter((r: any) => r.events)
          .map((r: any) => ({ id: r.events.id, title: r.events.title, start_date: r.events.start_time, relevance: "Recent RSVP by your network" }));
        return {
          text: JSON.stringify({ count: profiles.length, joins: profiles.slice(0, 8) }),
          results: { profiles, events },
        };
      }

      case "find_events": {
        let q = supabase
          .from("events")
          .select("id, title, start_time, description, location")
          .eq("is_public", true)
          .gte("start_time", new Date().toISOString());
        if (args.query) {
          const k = String(args.query).trim();
          q = q.or(`title.ilike.%${k}%,description.ilike.%${k}%`);
        }
        if (args.location) q = q.ilike("location", `%${args.location}%`);
        const { data } = await q.order("start_time", { ascending: true }).limit(ROW_CAP);
        const events = (data ?? []).map((e: any) => ({
          id: e.id, title: e.title, start_date: e.start_time, relevance: "Upcoming event",
        }));
        return { text: JSON.stringify({ count: events.length, events: events.slice(0, 8) }), results: { events } };
      }

      case "find_spaces": {
        const { data: memberships } = await supabase
          .from("space_members")
          .select("space_id")
          .eq("user_id", userId)
          .limit(200);
        const spaceIds = (memberships ?? []).map((m: any) => m.space_id).filter(Boolean);
        if (spaceIds.length === 0) return { text: JSON.stringify({ spaces: [] }), results: {} };
        let q = supabase.from("spaces").select("id, title, status, description").in("id", spaceIds);
        if (args.status) q = q.eq("status", args.status);
        if (args.query) {
          const k = String(args.query).trim();
          q = q.or(`title.ilike.%${k}%,description.ilike.%${k}%`);
        }
        const { data } = await q.limit(ROW_CAP);
        const projects = (data ?? []).map((s: any) => ({
          id: s.id, name: s.title, status: s.status ?? "active", relevance: "Your space",
        }));
        return { text: JSON.stringify({ count: projects.length, spaces: projects.slice(0, 8) }), results: { projects } };
      }

      case "find_opportunities": {
        let q = supabase
          .from("contribution_needs")
          .select("id, title, type, description, region, focus_areas, space:spaces(id, title)")
          .in("status", ["open", "in_progress"]);
        if (args.query) {
          const k = String(args.query).trim();
          q = q.or(`title.ilike.%${k}%,description.ilike.%${k}%`);
        }
        if (args.region) q = q.ilike("region", `%${args.region}%`);
        if (args.focus_area) q = q.contains("focus_areas", [args.focus_area]);
        const { data } = await q.order("created_at", { ascending: false }).limit(ROW_CAP);
        const opportunities = (data ?? []).map((o: any) => ({
          id: o.id, title: o.title, type: o.type,
          space_name: o.space?.title, region: o.region, focus_areas: o.focus_areas,
          relevance: "Open contribution need",
        }));
        return { text: JSON.stringify({ count: opportunities.length, opportunities: opportunities.slice(0, 8) }), results: { opportunities } };
      }

      case "my_post_analytics": {
        const days = args.since_days ?? 30;
        const since = new Date(Date.now() - days * 86400_000).toISOString();
        const { data: posts } = await supabase
          .from("posts")
          .select("id, title, content, view_count, created_at")
          .eq("author_id", userId)
          .eq("is_deleted", false)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(ROW_CAP);
        const p = posts ?? [];
        const totalViews = p.reduce((s: number, r: any) => s + (r.view_count ?? 0), 0);
        // Post-level likes/comments counts
        const ids = p.map((r: any) => r.id);
        let likes = 0, comments = 0;
        if (ids.length) {
          const [{ count: lc }, { count: cc }] = await Promise.all([
            supabase.from("post_likes").select("*", { count: "exact", head: true }).in("post_id", ids),
            supabase.from("post_comments").select("*", { count: "exact", head: true }).in("post_id", ids),
          ]);
          likes = lc ?? 0;
          comments = cc ?? 0;
        }
        const analytics = {
          window_days: days,
          post_count: p.length,
          total_views: totalViews,
          total_likes: likes,
          total_comments: comments,
          top_posts: p.slice(0, 5).map((r: any) => ({
            id: r.id, title: r.title ?? (r.content?.slice(0, 60) ?? ""), views: r.view_count ?? 0,
          })),
        };
        return { text: JSON.stringify(analytics), results: { analytics } };
      }

      case "find_stories_and_posts": {
        const days = args.since_days ?? 90;
        const since = new Date(Date.now() - days * 86400_000).toISOString();
        let q = supabase
          .from("posts")
          .select("id, title, subtitle, content, author_id, created_at, view_count, story_type")
          .eq("is_deleted", false)
          .eq("privacy_level", "public")
          .gte("created_at", since);
        if (args.query) {
          const k = String(args.query).trim();
          q = q.or(`title.ilike.%${k}%,content.ilike.%${k}%,subtitle.ilike.%${k}%`);
        }
        const { data } = await q.order("created_at", { ascending: false }).limit(ROW_CAP);
        const rows = data ?? [];
        const authorIds = Array.from(new Set(rows.map((r: any) => r.author_id).filter(Boolean)));
        const { data: authors } = authorIds.length
          ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", authorIds)
          : { data: [] as any[] };
        const authorMap = new Map((authors ?? []).map((a: any) => [a.id, a]));
        const stories = rows.map((r: any) => {
          const a = authorMap.get(r.author_id) ?? {};
          return {
            id: r.id,
            title: r.title ?? (r.content?.slice(0, 80) ?? "Untitled"),
            excerpt: r.subtitle ?? (r.content?.slice(0, 160) ?? ""),
            author: { id: r.author_id, name: a.full_name ?? "DNA Member", avatar_url: a.avatar_url },
            published_at: r.created_at,
            view_count: r.view_count ?? 0,
            like_count: 0,
            hashtags: [],
          };
        });
        return { text: JSON.stringify({ count: stories.length, stories: stories.slice(0, 8) }), results: { stories } };
      }

      case "web_search": {
        const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
        if (!apiKey) return { text: JSON.stringify({ error: "web_search unavailable" }), results: {} };
        const resp = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              { role: "system", content: "Answer concisely with citations. Focus on Africa, diaspora, and allied communities where relevant." },
              { role: "user", content: args.query },
            ],
            max_tokens: 700,
            temperature: 0.2,
            return_citations: true,
            ...(args.recency ? { search_recency_filter: args.recency } : {}),
          }),
        });
        if (!resp.ok) {
          const err = await resp.text();
          return { text: JSON.stringify({ error: `web_search failed: ${resp.status}`, details: err.slice(0, 200) }), results: {} };
        }
        const j = await resp.json();
        const content = j?.choices?.[0]?.message?.content ?? "";
        const cites: string[] = j?.citations ?? [];
        for (const c of cites) if (!webCitations.includes(c)) webCitations.push(c);
        return { text: JSON.stringify({ answer: content, citations: cites.slice(0, 8) }), results: {} };
      }

      default:
        return { text: JSON.stringify({ error: `Unknown tool: ${name}` }), results: {} };
    }
  } catch (err: any) {
    console.error(`Tool ${name} error:`, err?.message ?? err);
    return { text: JSON.stringify({ error: err?.message ?? "tool_error" }), results: {} };
  }
}
