import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseRest, wrapHandler } from "../_shared";

const InputSchema = z.object({
  query: z.string().trim().max(100).optional().describe("Optional keyword filter (title/description)."),
  limit: z.number().int().min(1).max(25).optional().describe("Max results (default 10)."),
});

interface EventResult {
  id: string;
  title: string | null;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
  location_city: string | null;
  location_country: string | null;
  event_type: string | null;
  event_url: string;
}

export default defineTool({
  name: "list_upcoming_events",
  title: "List upcoming DNA events",
  description:
    "List upcoming public events on the DNA platform (Convene module). Optionally filter by keyword.",
  inputSchema: InputSchema.shape,
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: wrapHandler("list_upcoming_events", InputSchema, async ({ query, limit }) => {
    const nowIso = new Date().toISOString();
    const n = limit ?? 10;
    let path =
      `events?select=id,title,description,start_time,end_time,location_name,location_city,location_country,event_type,slug` +
      `&start_time=gte.${nowIso}&order=start_time.asc&limit=${n}`;
    if (query) {
      const q = encodeURIComponent(query.replace(/[*(),]/g, ""));
      path += `&or=(title.ilike.*${q}*,description.ilike.*${q}*)`;
    }
    const rows = (await supabaseRest({ path })) as Array<Record<string, unknown>>;
    const results: EventResult[] = rows.map((r) => ({
      id: r.id as string,
      title: (r.title as string) ?? null,
      description: (r.description as string) ?? null,
      start_time: (r.start_time as string) ?? null,
      end_time: (r.end_time as string) ?? null,
      location_name: (r.location_name as string) ?? null,
      location_city: (r.location_city as string) ?? null,
      location_country: (r.location_country as string) ?? null,
      event_type: (r.event_type as string) ?? null,
      event_url: r.slug
        ? `https://diasporanetwork.africa/dna/events/${r.slug}`
        : `https://diasporanetwork.africa/dna/events/${r.id}`,
    }));
    return { count: results.length, results };
  }),
});
