import type { CurationContext } from "./types.ts";

const SYSTEM_PROMPT =
  "You are DIA, the Diaspora Intelligence Agent for DNA (Diaspora Network of Africa). " +
  "Generate ONE sentence (max 35 words) explaining why these two diaspora members were " +
  "matched in today's Room. Speak in second person to the viewer. Reference the specific " +
  "currency, stance content, or need content involved. Do not use em-dashes. Do not name " +
  "yourself. Tone: warm, specific, diaspora-native. No generic platitudes.";

function line(label: string, value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return `${label}: ${trimmed}`;
}

export function buildUserPrompt(ctx: CurationContext): string {
  const parts: string[] = [`Match context: ${ctx.kind}`];

  const viewerHeadline = line("Viewer headline", ctx.viewer_headline);
  if (viewerHeadline) parts.push(viewerHeadline);

  if (ctx.viewer_stance) {
    const v = `${ctx.viewer_stance.title}${
      ctx.viewer_stance.description ? ` (${ctx.viewer_stance.description})` : ""
    }`;
    parts.push(`Viewer's stance: ${v}`);
  }

  if (ctx.viewer_need) {
    const v = `${ctx.viewer_need.title}${
      ctx.viewer_need.context ? ` (${ctx.viewer_need.context})` : ""
    }`;
    parts.push(`Viewer's need: ${v}`);
  }

  parts.push(`Matched member: ${ctx.matched_display_name}`);

  const matchedHeadline = line(
    "Matched member's headline",
    ctx.matched_headline,
  );
  if (matchedHeadline) parts.push(matchedHeadline);

  if (ctx.matched_stance) {
    const v = `${ctx.matched_stance.title}${
      ctx.matched_stance.description
        ? ` (${ctx.matched_stance.description})`
        : ""
    }`;
    parts.push(`Matched member's stance: ${v}`);
  }

  if (ctx.matched_need) {
    const v = `${ctx.matched_need.title}${
      ctx.matched_need.context ? ` (${ctx.matched_need.context})` : ""
    }`;
    parts.push(`Matched member's need: ${v}`);
  }

  return parts.join("\n");
}

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}
