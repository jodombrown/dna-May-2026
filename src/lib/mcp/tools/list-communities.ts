import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseRest, wrapHandler } from "../_shared";

const InputSchema = z.object({
  query: z.string().trim().max(100).optional().describe("Optional keyword filter on community name/description/tags."),
  category: z.string().trim().max(64).optional().describe("Optional category filter."),
  featured_only: z.boolean().optional().describe("If true, return only featured communities."),
  limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)."),
});

interface CommunityResult {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  member_count: number | null;
  is_featured: boolean | null;
  image_url: string | null;
  tags: string[] | null;
}

export default defineTool({
  name: "list_communities",
  title: "List DNA communities",
  description:
    "List active public DNA communities (African diaspora affinity groups, chapters, and interest groups). Supports optional keyword search, category filter, and featured-only filter. Useful for agent discovery of relevant communities.",
  inputSchema: InputSchema.shape,
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: wrapHandler(
    "list_communities",
    InputSchema,
    async ({ query, category, featured_only, limit }) => {
      const n = limit ?? 20;
      let path =
        `communities?select=id,name,description,category,member_count,is_featured,image_url,tags` +
        `&is_active=eq.true&moderation_status=eq.approved` +
        `&order=member_count.desc.nullslast&limit=${n}`;
      if (featured_only) path += `&is_featured=eq.true`;
      if (category) {
        const c = encodeURIComponent(category.replace(/[*(),]/g, ""));
        path += `&category=eq.${c}`;
      }
      if (query) {
        const q = encodeURIComponent(query.replace(/[*(),]/g, ""));
        path += `&or=(name.ilike.*${q}*,description.ilike.*${q}*)`;
      }
      const rows = (await supabaseRest({ path })) as Array<Record<string, unknown>>;
      const results: CommunityResult[] = rows.map((r) => ({
        id: r.id as string,
        name: r.name as string,
        description: (r.description as string) ?? null,
        category: (r.category as string) ?? null,
        member_count: (r.member_count as number) ?? null,
        is_featured: (r.is_featured as boolean) ?? null,
        image_url: (r.image_url as string) ?? null,
        tags: (r.tags as string[]) ?? null,
      }));
      return { count: results.length, results };
    },
  ),
});
