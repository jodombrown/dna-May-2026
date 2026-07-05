import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_upcoming_events",
  title: "List upcoming DNA events",
  description:
    "List upcoming public events on the DNA platform (Convene module). Optionally filter by keyword.",
  inputSchema: {
    query: z.string().trim().optional().describe("Optional keyword filter (title/description)."),
    limit: z.number().int().min(1).max(25).optional().describe("Max results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!;
    const nowIso = new Date().toISOString();
    const n = limit ?? 10;
    let path =
      `events?select=id,title,description,start_time,end_time,location,event_type,slug` +
      `&start_time=gte.${nowIso}&order=start_time.asc&limit=${n}`;
    if (query) {
      const q = encodeURIComponent(query);
      path += `&or=(title.ilike.*${q}*,description.ilike.*${q}*)`;
    }
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `Supabase error ${res.status}: ${await res.text()}` }],
        isError: true,
      };
    }
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    const results = rows.map((r) => ({
      ...r,
      event_url: r.slug
        ? `https://diasporanetwork.africa/dna/events/${r.slug}`
        : `https://diasporanetwork.africa/dna/events/${r.id}`,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      structuredContent: { results },
    };
  },
});
