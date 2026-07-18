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
  display_name: string | null;
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
    // D089: read through the SECURITY DEFINER projection (is_public + not-deleted gate),
    // never the profiles table directly (which is TO authenticated and returns nothing to anon).
    const obj = (await supabaseRest({
      path: `rpc/get_public_profile?p_username=${uname}`,
    })) as Record<string, unknown> | null;
    if (!obj || Object.keys(obj).length === 0) {
      throw new McpToolError("not_found", `No public profile found for @${username}`);
    }
    const profile: ProfileDetail = {
      username: obj.username as string,
      full_name: (obj.full_name as string) ?? null,
      display_name: (obj.display_name as string) ?? null,
      headline: (obj.headline as string) ?? null,
      bio: (obj.bio as string) ?? null,
      avatar_url: (obj.avatar_url as string) ?? null,
      city: (obj.city as string) ?? null,
      country: (obj.country as string) ?? null,
      website_url: (obj.website_url as string) ?? null,
      profile_url: `https://diasporanetwork.africa/dna/${obj.username}`,
    };
    return { profile };
  }),
});
