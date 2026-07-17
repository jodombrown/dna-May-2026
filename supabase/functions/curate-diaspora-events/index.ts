import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireInternal } from "../_shared/auth.ts";
import { PERPLEXITY_URL, PERPLEXITY_MODEL, writeEvent } from '../_shared/dia-core/index.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const PERPLEXITY_PROMPT = `Find 15-20 real upcoming events in 2026 relevant to the African diaspora community worldwide. Include conferences, summits, festivals, workshops, and networking events. Cover categories: tech, business/investment, culture/arts, healthcare, education, and social impact. Include events in Africa (Lagos, Nairobi, Accra, Kigali, Cape Town, Addis Ababa) AND diaspora cities (London, New York, Atlanta, Toronto, Paris, Dubai). For each event provide: title, description (2-3 sentences), event_type (one of: conference, workshop, meetup, networking, social, other), format (one of: in_person, virtual, hybrid), location_name (venue name), location_city, location_country, start_time (ISO 8601 datetime), end_time (ISO 8601 datetime), website_url (the event's actual website URL if known, otherwise null), tags (array of 2-4 relevant tags like "tech", "investment", "culture", "health", "education", "social"). Only include real events that are actually scheduled or have been announced. Do not invent fictional events.`;

const EVENT_SCHEMA = {
  type: "object" as const,
  properties: {
    events: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          title: { type: "string" as const },
          description: { type: "string" as const },
          event_type: { type: "string" as const },
          format: { type: "string" as const },
          location_name: { type: "string" as const },
          location_city: { type: "string" as const },
          location_country: { type: "string" as const },
          start_time: { type: "string" as const },
          end_time: { type: "string" as const },
          website_url: { type: ["string", "null"] as const },
          tags: { type: "array" as const, items: { type: "string" as const } },
        },
        required: [
          "title", "description", "event_type", "format",
          "location_name", "location_city", "location_country",
          "start_time", "end_time", "tags",
        ],
      },
    },
  },
  required: ["events"],
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __auth = requireInternal(req);
  if (!__auth.ok) return __auth.response;

  const startTime = Date.now();

  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Call Perplexity API
    console.log("Calling Perplexity API for diaspora events...");
    const perplexityResponse = await fetch(
      PERPLEXITY_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: PERPLEXITY_MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are a research assistant that finds real upcoming events relevant to the African diaspora. Return only factual, verifiable events. If you cannot find enough real events, return fewer rather than inventing fictional ones.",
            },
            { role: "user", content: PERPLEXITY_PROMPT },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "diaspora_events",
              schema: EVENT_SCHEMA,
            },
          },
          temperature: 0.1,
        }),
      }
    );

    if (!perplexityResponse.ok) {
      const errText = await perplexityResponse.text();
      throw new Error(
        `Perplexity API error [${perplexityResponse.status}]: ${errText}`
      );
    }

    const perplexityData = await perplexityResponse.json();
    const content = perplexityData.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in Perplexity response");
    }

    const parsed = JSON.parse(content);
    const events = parsed.events;
    if (!Array.isArray(events) || events.length === 0) {
      throw new Error("No events returned from Perplexity");
    }

    console.log(`Perplexity returned ${events.length} events`);

    // Fetch existing curated events for deduplication
    const { data: existingEvents } = await supabase
      .from("events")
      .select("title, start_time")
      .eq("is_curated", true);

    const existingSet = new Set(
      (existingEvents || []).map(
        (e: { title: string; start_time: string }) =>
          `${e.title.toLowerCase().trim()}|${e.start_time?.slice(0, 10)}`
      )
    );

    // Cover images by category
    const coverImages: Record<string, string> = {
      conference:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
      workshop:
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=400&fit=crop",
      meetup:
        "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop",
      networking:
        "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop",
      social:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
      other:
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop",
    };

    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const event of events) {
      const dedupeKey = `${event.title.toLowerCase().trim()}|${event.start_time?.slice(0, 10)}`;
      if (existingSet.has(dedupeKey)) {
        skipped++;
        continue;
      }

      const validTypes = ["conference", "workshop", "meetup", "webinar", "networking", "social", "other"];
      const eventType = validTypes.includes(event.event_type) ? event.event_type : "other";

      const validFormats = ["in_person", "virtual", "hybrid"];
      const eventFormat = validFormats.includes(event.format) ? event.format : "in_person";

      const coverImage = coverImages[eventType] || coverImages["other"];

      const slug = event.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);

      // Curated events have NO organizer_id — they belong to DNA itself
      const { error: insertError } = await supabase.from("events").insert({
        title: event.title,
        description: event.description,
        event_type: eventType,
        format: eventFormat,
        location_name: event.location_name,
        location_city: event.location_city,
        location_country: event.location_country,
        start_time: event.start_time,
        end_time: event.end_time,
        cover_image_url: coverImage,
        slug: slug,
        organizer_id: null,
        is_public: true,
        is_published: true,
        status: "published",
        is_curated: true,
        curated_source: "perplexity",
        curated_source_url: event.website_url || null,
        curated_at: new Date().toISOString(),
        tags: event.tags || [],
        timezone: "UTC",
      });

      if (insertError) {
        errors.push(`Failed to insert "${event.title}": ${insertError.message}`);
      } else {
        inserted++;
        existingSet.add(dedupeKey);
      }
    }

    const summary = {
      success: true,
      total_from_perplexity: events.length,
      inserted,
      skipped,
      errors,
    };

    await writeEvent(supabase, {
      userId: null, principalType: 'service', capability: 'curate',
      surface: 'curate-diaspora-events', provider: 'perplexity', model: PERPLEXITY_MODEL,
      success: true, latencyMs: Date.now() - startTime,
      meta: { total_from_perplexity: events.length, inserted, skipped },
    });

    console.log("Curation complete:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in curate-diaspora-events:", error);
    try {
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await writeEvent(admin, {
        userId: null, principalType: 'service', capability: 'curate',
        surface: 'curate-diaspora-events', provider: 'perplexity', model: PERPLEXITY_MODEL,
        success: false, latencyMs: Date.now() - startTime,
        errorCode: 'curate_failed', errorMessage: (error instanceof Error ? error.message : String(error)).slice(0, 300),
      });
    } catch { /* never mask the original error */ }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
