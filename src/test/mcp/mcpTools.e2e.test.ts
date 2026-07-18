/**
 * End-to-end tests for the DNA MCP server, executed against the deployed
 * Supabase Edge Function. These tests hit the same public HTTPS endpoint that
 * ChatGPT/Claude/Cursor use, so they cover both "mobile" and "desktop" clients
 * (transport is HTTPS/JSON — no client-specific differences).
 *
 * Run with:  bunx vitest run src/test/mcp
 */
import { describe, it, expect, beforeAll } from "vitest";

const PROJECT_REF =
  process.env.VITE_SUPABASE_PROJECT_ID ?? "ybhssuehmfnxrzneobok";
const MCP_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/mcp`;

interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: T;
  error?: { code: number; message: string };
}

interface McpToolCallResult {
  content: Array<{ type: string; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

interface McpListToolsResult {
  tools: Array<{ name: string; description?: string; inputSchema?: unknown }>;
}

let nextId = 1;
async function rpc<T>(method: string, params?: Record<string, unknown>): Promise<JsonRpcResponse<T>> {
  const id = nextId++;
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params: params ?? {} }),
  });
  const text = await res.text();
  // Streamable HTTP may return either JSON or SSE. Parse both.
  if (text.startsWith("event:") || text.startsWith("data:")) {
    const dataLine = text.split("\n").find((l) => l.startsWith("data:"));
    if (!dataLine) throw new Error(`No SSE data line in response: ${text}`);
    return JSON.parse(dataLine.slice(5).trim()) as JsonRpcResponse<T>;
  }
  return JSON.parse(text) as JsonRpcResponse<T>;
}

async function callTool(name: string, args: Record<string, unknown>): Promise<McpToolCallResult> {
  const r = await rpc<McpToolCallResult>("tools/call", { name, arguments: args });
  expect(r.error, `RPC error for ${name}: ${JSON.stringify(r.error)}`).toBeUndefined();
  expect(r.result).toBeDefined();
  return r.result as McpToolCallResult;
}

describe("DNA MCP server (deployed)", () => {
  beforeAll(() => {
    // Warm-start: functions cold-start on first hit.
  });

  it("lists all three tools", async () => {
    const r = await rpc<McpListToolsResult>("tools/list");
    expect(r.result).toBeDefined();
    const names = (r.result?.tools ?? []).map((t) => t.name).sort();
    expect(names).toEqual(
      ["get_profile", "list_communities", "list_upcoming_events"].sort(),
    );
  }, 30_000);

  it("get_profile returns typed not_found for unknown username", async () => {
    const res = await callTool("get_profile", {
      username: `zz-nope-${Math.random().toString(36).slice(2, 8)}`,
    });
    expect(res.isError).toBe(true);
    const err = (res.structuredContent as { error?: { code: string } })?.error;
    expect(err?.code).toBe("not_found");
  }, 30_000);

  it("get_profile rejects invalid username characters", async () => {
    const res = await callTool("get_profile", { username: "no spaces!" });
    expect(res.isError).toBe(true);
    const errText = (res.content?.[0]?.text ?? "") + JSON.stringify(res.structuredContent ?? {});
    expect(errText).toMatch(/invalid_input|Input validation|regex|letters/i);
  }, 30_000);

  it("list_upcoming_events returns a results array", async () => {
    const res = await callTool("list_upcoming_events", { limit: 5 });
    expect(res.isError, `unexpected error: ${res.content?.[0]?.text}`).toBeFalsy();
    expect(Array.isArray((res.structuredContent as { results: unknown[] }).results)).toBe(true);
  }, 30_000);

  it("list_communities returns a results array", async () => {
    const res = await callTool("list_communities", { limit: 5 });
    expect(res.isError, `unexpected error: ${res.content?.[0]?.text}`).toBeFalsy();
    expect(Array.isArray((res.structuredContent as { results: unknown[] }).results)).toBe(true);
  }, 30_000);

  it("list_communities rejects negative limit", async () => {
    const res = await callTool("list_communities", { limit: -1 });
    expect(res.isError).toBe(true);
    const errText = (res.content?.[0]?.text ?? "") + JSON.stringify(res.structuredContent ?? {});
    expect(errText).toMatch(/invalid_input|Input validation|too_small|Too small/i);
  }, 30_000);
});
