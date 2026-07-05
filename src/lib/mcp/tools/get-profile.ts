import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_profile",
  title: "Get DNA profile by username",
  description:
    "Fetch a single public DNA member profile by username (the /dna/<username> handle).",
  inputSchema: {
    username: z.string().trim().min(1).describe("The DNA username, without the leading @ or /dna/."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ username }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!;
    const uname = encodeURIComponent(username.replace(/^@/, ""));
    const path =
      `profiles?select=username,full_name,headline,bio,avatar_url,city,country,website_url` +
      `&username=eq.${uname}&limit=1`;
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
    if (rows.length === 0) {
      return { content: [{ type: "text", text: `No profile found for @${username}` }], isError: true };
    }
    const profile = {
      ...rows[0],
      profile_url: `https://diasporanetwork.africa/dna/${rows[0].username}`,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(profile, null, 2) }],
      structuredContent: { profile },
    };
  },
});
