import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

async function restGet(path: string): Promise<unknown> {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

export default defineTool({
  name: "search_profiles",
  title: "Search DNA member profiles",
  description:
    "Search public DNA (Diaspora Network of Africa) member profiles by name, username, or headline. Returns basic public info and a shareable /dna/<username> profile link.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Name, username, or keyword to search for."),
    limit: z.number().int().min(1).max(25).optional().describe("Max results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const q = encodeURIComponent(query);
    const n = limit ?? 10;
    const path =
      `profiles?select=username,full_name,headline,avatar_url,city,country` +
      `&or=(username.ilike.*${q}*,full_name.ilike.*${q}*,headline.ilike.*${q}*)` +
      `&limit=${n}`;
    const rows = (await restGet(path)) as Array<Record<string, unknown>>;
    const results = rows.map((r) => ({
      ...r,
      profile_url: r.username ? `https://diasporanetwork.africa/dna/${r.username}` : null,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      structuredContent: { results },
    };
  },
});
