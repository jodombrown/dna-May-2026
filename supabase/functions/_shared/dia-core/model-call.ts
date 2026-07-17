// DIA Core — the single gateway call. Every DIA function's model inference goes
// through here so the gateway URL, auth header, and response normalization live
// in one place. Functions keep their own orchestration (tool loops, prompts);
// dia-core owns only the raw call + model selection.
import { GATEWAY_URL, modelFor, providerOf, type DiaCapability } from "./models.ts";

export interface CallModelOpts {
  capability: DiaCapability;
  messages: unknown[];
  tools?: unknown[];
  // "auto" | "none" | a tool name, or the OpenAI forced-function object
  // ({ type: "function", function: { name } }) used by the compose/smart lane.
  toolChoice?: "auto" | "none" | string | Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
  modelOverride?: string; // escape hatch; caller still holds no literal
  responseFormat?: { type: string }; // e.g. { type: "json_object" }
}

export interface CallModelResult {
  message: any; // choices[0].message
  tokens: number; // usage.total_tokens
  model: string;
  provider: string;
  raw: any;
}

export async function callModel(opts: CallModelOpts): Promise<CallModelResult> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
  const model = opts.modelOverride ?? modelFor(opts.capability);

  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
  };
  // Only forward sampling params the caller actually set. A caller that omits
  // temperature / max_tokens gets the gateway's own defaults — this keeps
  // re-pointed functions transport-identical to their pre-dia-core request,
  // which did not send these fields at all.
  if (opts.temperature !== undefined) body.temperature = opts.temperature;
  if (opts.maxTokens !== undefined) body.max_tokens = opts.maxTokens;
  if (opts.tools) {
    body.tools = opts.tools;
    body.tool_choice = opts.toolChoice ?? "auto";
  }
  if (opts.responseFormat) body.response_format = opts.responseFormat;

  const resp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${err.slice(0, 300)}`);
  }
  const json = await resp.json();
  return {
    message: json?.choices?.[0]?.message,
    tokens: json?.usage?.total_tokens ?? 0,
    model,
    provider: providerOf(model),
    raw: json,
  };
}
