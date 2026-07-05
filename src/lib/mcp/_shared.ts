/**
 * Shared helpers for MCP tools.
 * Keep import-safe: no env reads or I/O at module top level.
 */
import type { ToolContext } from "@lovable.dev/mcp-js";
import { z, ZodError } from "zod";

export interface McpToolResult {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

interface RestQueryOptions {
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
}

/**
 * Read Supabase REST endpoint using the publishable (anon) key.
 * Called from tool handlers only, never at import time.
 */
export async function supabaseRest(opts: RestQueryOptions): Promise<unknown> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("mcp: Supabase env not configured");
  const res = await fetch(`${url}/rest/v1/${opts.path}`, {
    method: opts.method ?? "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new McpToolError("upstream_error", `Supabase ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

/**
 * Structured error thrown from tool handlers so the wrapper can produce
 * a typed MCP error response (code + message) instead of failing silently.
 */
export class McpToolError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

interface TelemetryEvent {
  tool_name: string;
  success: boolean;
  latency_ms: number;
  error_code: string | null;
  error_message: string | null;
  client_id: string | null;
  input_summary: Record<string, unknown> | null;
}

/**
 * Fire-and-forget analytics write. Never throws — telemetry must not
 * mask real tool responses.
 */
async function recordEvent(evt: TelemetryEvent): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;
  try {
    await fetch(`${url}/rest/v1/mcp_tool_events`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(evt),
    });
  } catch {
    // Swallow — telemetry is best-effort.
  }
}

/**
 * Redact tool input to a small, PII-conscious summary for telemetry.
 * Only primitive values, string values truncated to 80 chars.
 */
function summarizeInput(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object") return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (v == null) continue;
    if (typeof v === "string") out[k] = v.slice(0, 80);
    else if (typeof v === "number" || typeof v === "boolean") out[k] = v;
    else out[k] = typeof v;
  }
  return out;
}

/**
 * Wrap a tool handler with:
 *  - Strict zod validation (throws typed McpToolError on bad input).
 *  - Latency + success/failure telemetry to `mcp_tool_events`.
 *  - Typed JSON error responses on failure (no silent crashes).
 */
export function wrapHandler<TSchema extends z.ZodTypeAny, TOut extends Record<string, unknown>>(
  toolName: string,
  schema: TSchema,
  fn: (input: z.infer<TSchema>, ctx: ToolContext) => Promise<TOut>,
): (rawInput: unknown, ctx: ToolContext) => Promise<McpToolResult> {
  return async (rawInput, ctx) => {
    const start = Date.now();
    let parsedInput: z.infer<TSchema> | null = null;
    let errorCode: string | null = null;
    let errorMessage: string | null = null;
    let success = false;
    try {
      const parsed = schema.safeParse(rawInput);
      if (!parsed.success) {
        throw new McpToolError(
          "invalid_input",
          `Invalid input for ${toolName}: ${formatZodError(parsed.error)}`,
        );
      }
      parsedInput = parsed.data;
      const structured = await fn(parsedInput, ctx);
      success = true;
      return {
        content: [{ type: "text", text: JSON.stringify(structured, null, 2) }],
        structuredContent: structured,
      };
    } catch (err) {
      if (err instanceof McpToolError) {
        errorCode = err.code;
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorCode = "internal_error";
        errorMessage = err.message;
      } else {
        errorCode = "unknown_error";
        errorMessage = "Unknown error";
      }
      const payload = { error: { code: errorCode, message: errorMessage } };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        structuredContent: payload,
        isError: true,
      };
    } finally {
      const latency = Date.now() - start;
      let clientId: string | null = null;
      try {
        clientId = ctx.getClientId?.() ?? null;
      } catch {
        clientId = null;
      }
      void recordEvent({
        tool_name: toolName,
        success,
        latency_ms: latency,
        error_code: errorCode,
        error_message: errorMessage ? errorMessage.slice(0, 500) : null,
        client_id: clientId,
        input_summary: summarizeInput(parsedInput ?? rawInput),
      });
    }
  };
}

function formatZodError(err: ZodError): string {
  return err.issues
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}
