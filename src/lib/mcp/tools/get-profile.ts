import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { McpToolError, supabaseRest, wrapHandler } from "../_shared";

const InputSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^@?[A-Za-z0-9._-]+$/, "username may only contain letters, numbers, . _ -")
    .describe("The DNA username, without the leading @ or /dna/."),
});

interface ProfileDetail {
  username: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  website_url: string | null;
  profile_url: string;
}

export default defineTool({
  name: "get_profile",
  title: "Get DNA profile by username",
  description:
    "Fetch a single public DNA member profile by username (the /dna/<username> handle).",
  inputSchema: InputSchema.shape,
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: wrapHandler("get_profile", InputSchema, async ({ username }) => {
    const uname = encodeURIComponent(username.replace(/^@/, ""));
    const rows = (await supabaseRest({
      path:
        `profiles?select=username,full_name,headline,bio,avatar_url,city,country,website_url` +
        `&username=eq.${uname}&limit=1`,
    })) as Array<Record<string, unknown>>;
    if (rows.length === 0) {
      throw new McpToolError("not_found", `No profile found for @${username}`);
    }
    const r = rows[0];
    const profile: ProfileDetail = {
      username: r.username as string,
      full_name: (r.full_name as string) ?? null,
      headline: (r.headline as string) ?? null,
      bio: (r.bio as string) ?? null,
      avatar_url: (r.avatar_url as string) ?? null,
      city: (r.city as string) ?? null,
      country: (r.country as string) ?? null,
      website_url: (r.website_url as string) ?? null,
      profile_url: `https://diasporanetwork.africa/dna/${r.username}`,
    };
    return { profile };
  }),
});
