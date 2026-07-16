// DIA Core — the thin shared substrate every DIA edge function passes through.
// Five concerns in one place: identity, consent, limits, audit, model-config.
// Promotes _shared/dia-tools.ts as the canonical tool registry.
export * from "./models.ts";
export * from "./model-call.ts";
export * from "./identity.ts";
export * from "./consent.ts";
export * from "./limits.ts";
export * from "./audit.ts";

// Canonical tool registry (promoted; surfaced through dia-core).
export { TOOL_DEFINITIONS, executeTool, makeUserClient, emptyResults } from "../dia-tools.ts";
export type { ToolContext, AggregatedResults } from "../dia-tools.ts";
