import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseRest, wrapHandler } from "../_shared";

const InputSchema = z.object({
  query: z.string().trim().min(1).max(100).describe("Name, username, or keyword to search for."),
  limit: z.number().int().min(1).max(25).optional().describe("Max results (default 10)."),
});

interface ProfileResult {
  username: string | null;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  profile_url: string | null;
}

export default defineTool({
  name: "search_profiles",
  title: "Search DNA member profiles",
  description:
    "Search public DNA (Diaspora Network of Africa) member profiles by name, username, or headline. Returns basic public info and a shareable /dna/<username> profile link.",
  inputSchema: InputSchema.shape,
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: wrapHandler("search_profiles", InputSchema, async ({ query, limit }) => {
    const q = encodeURIComponent(query.replace(/[*(),]/g, ""));
    const n = limit ?? 10;
    const rows = (await supabaseRest({
      path:
        `profiles?select=username,full_name,headline,avatar_url,city,country` +
        `&or=(username.ilike.*${q}*,full_name.ilike.*${q}*,headline.ilike.*${q}*)` +
        `&limit=${n}`,
    })) as Array<Record<string, unknown>>;
    const results: ProfileResult[] = rows.map((r) => ({
      username: (r.username as string) ?? null,
      full_name: (r.full_name as string) ?? null,
      headline: (r.headline as string) ?? null,
      avatar_url: (r.avatar_url as string) ?? null,
      city: (r.city as string) ?? null,
      country: (r.country as string) ?? null,
      profile_url: r.username ? `https://diasporanetwork.africa/dna/${r.username}` : null,
    }));
    return { count: results.length, results };
  }),
});
