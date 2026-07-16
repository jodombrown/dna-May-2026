// DIA Core — model configuration.
// THE single place gateway URLs + model strings live (BD125 exit gate:
// zero gateway URLs or model literals outside dia-core).
//
// The Lovable AI gateway is OpenAI-compatible and provider-routing, so moving a
// capability to Anthropic is a one-line change to the model string below
// (e.g. "anthropic/claude-*") — no new gateway, no new key. Price vs Gemini with
// real numbers before any swap (DIA2 deliverable); this file is the reversible seam.

export const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
export const PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions";

// Perplexity model for the web_search tool (Perplexity stays a tool in the loop, not a spine).
export const PERPLEXITY_MODEL = "sonar";

// Capability classes. Extend as functions are re-pointed and their live model is confirmed.
export type DiaCapability =
  | "reactive_query"
  | "compose_read"
  | "smart_replies"
  | "smart_compose"
  | "smart_chips"
  | "thread_summary"
  | "inbox_brief"
  | "daily_pulse"
  | "daily_insights"
  | "hub_intelligence"
  | "trigger_prompt"
  | "connect_nudges"
  | "opportunity_nudges"
  | "daily_brief"
  | "event_recommendations"
  | "suggest_usernames"
  | "curate";

// Default per-capability routing. ONLY capabilities whose current live model was
// confirmed by grep against the deployed source are hardcoded here; every other
// capability resolves via the fallback in modelFor() until its own re-point
// confirms its live model (then add its verified entry here). This keeps the map
// honest — no unverified guesses.
const GATEWAY_MODELS: Partial<Record<DiaCapability, string>> = {
  reactive_query: "google/gemini-2.5-flash",        // dia-search
  compose_read: "google/gemini-3-flash-preview",    // dia-compose-read
  smart_replies: "google/gemini-3-flash-preview",   // dia-smart-replies
  smart_compose: "google/gemini-3-flash-preview",   // dia-smart-compose
  thread_summary: "google/gemini-3-flash-preview",  // dia-thread-summary
  inbox_brief: "google/gemini-3-flash-preview",     // dia-inbox-brief
  daily_pulse: "google/gemini-3-flash-preview",     // dia-daily-pulse
  daily_insights: "google/gemini-2.5-flash",        // dia-daily-insights
  event_recommendations: "google/gemini-2.5-flash", // get-event-recommendations (Tier-2)
  suggest_usernames: "google/gemini-2.5-flash",     // suggest-usernames (Tier-2)
};

const FALLBACK_MODEL = "google/gemini-2.5-flash";

// Anthropic-through-the-gateway alternates, config-ready (NOT active).
// Move a capability by pointing GATEWAY_MODELS[cap] at one of these. The exact
// gateway slug MUST be confirmed against the Lovable gateway's model list before
// activating — these strings are the mechanism, not a verified catalog entry.
export const ANTHROPIC_ALTERNATES = {
  haiku: "anthropic/claude-haiku-4-5",
  sonnet: "anthropic/claude-sonnet-4-5",
  // opus reserved for agentic lanes (DIA3)
} as const;

export function modelFor(capability: DiaCapability): string {
  return GATEWAY_MODELS[capability] ?? FALLBACK_MODEL;
}

export function providerOf(model: string): string {
  if (model.startsWith("anthropic/")) return "anthropic";
  if (model.startsWith("google/")) return "gemini";
  if (model.startsWith("openai/")) return "openai";
  return "gateway";
}
