/**
 * DNA Admin — Agent Integrations settings panel.
 * Shows the MCP server endpoint and copyable client connection configs.
 * The DNA MCP server currently exposes only public read-only tools, so no
 * credentials are required. If per-user tools are added later, wire OAuth
 * here (Supabase OAuth 2.1) rather than a static API key.
 */
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, ExternalLink, ShieldCheck, Info } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function AgentIntegrations() {
  const { isAdmin, loading } = useIsAdmin();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const projectRef = (import.meta.env.VITE_SUPABASE_PROJECT_ID as string) || "ybhssuehmfnxrzneobok";
  const mcpUrl = `https://${projectRef}.supabase.co/functions/v1/mcp`;

  const claudeConfig = useMemo(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            "dna-platform": {
              url: mcpUrl,
              transport: "http",
            },
          },
        },
        null,
        2,
      ),
    [mcpUrl],
  );

  const cursorConfig = useMemo(
    () =>
      JSON.stringify(
        {
          "dna-platform": { url: mcpUrl },
        },
        null,
        2,
      ),
    [mcpUrl],
  );

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      toast.error("Copy failed — copy manually");
    }
  }

  if (loading) return <div className="text-center py-12 text-muted-foreground">Verifying access...</div>;
  if (!isAdmin) {
    return (
      <Card className="p-12 text-center space-y-2">
        <ShieldCheck className="h-8 w-8 mx-auto text-destructive" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">Admins only</h2>
        <p className="text-sm text-muted-foreground">
          Agent integration settings are restricted to platform admins.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Agent Integrations</h2>
        <p className="text-sm text-muted-foreground mt-1">
          MCP (Model Context Protocol) server that lets AI agents like ChatGPT, Claude, and Cursor
          query the DNA platform.
        </p>
      </div>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Server endpoint</h3>
            <p className="text-xs text-muted-foreground">Streamable HTTP transport</p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800">Public / read-only</Badge>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 rounded-lg bg-muted text-xs font-mono break-all text-foreground">
            {mcpUrl}
          </code>
          <Button size="sm" variant="outline" onClick={() => copy("url", mcpUrl)}>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            {copiedKey === "url" ? "Copied" : "Copy"}
          </Button>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Credentials:</strong> none required. The DNA MCP
            server currently exposes only public, read-only tools (search profiles, get profile,
            list upcoming events, list communities), so agents connect without a token. When
            per-user tools are added, this panel will surface a Supabase OAuth flow.
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Claude Desktop config</h3>
          <Button size="sm" variant="outline" onClick={() => copy("claude", claudeConfig)}>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            {copiedKey === "claude" ? "Copied" : "Copy"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste into <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>
        </p>
        <pre className="p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto text-foreground">
          {claudeConfig}
        </pre>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Cursor / Windsurf config</h3>
          <Button size="sm" variant="outline" onClick={() => copy("cursor", cursorConfig)}>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            {copiedKey === "cursor" ? "Copied" : "Copy"}
          </Button>
        </div>
        <pre className="p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto text-foreground">
          {cursorConfig}
        </pre>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold text-foreground">Available tools</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <code className="text-xs px-1.5 py-0.5 rounded bg-muted">search_profiles</code>
            <span className="text-muted-foreground ml-2">Search public member profiles.</span>
          </li>
          <li>
            <code className="text-xs px-1.5 py-0.5 rounded bg-muted">get_profile</code>
            <span className="text-muted-foreground ml-2">Fetch a single profile by username.</span>
          </li>
          <li>
            <code className="text-xs px-1.5 py-0.5 rounded bg-muted">list_upcoming_events</code>
            <span className="text-muted-foreground ml-2">List upcoming public events.</span>
          </li>
          <li>
            <code className="text-xs px-1.5 py-0.5 rounded bg-muted">list_communities</code>
            <span className="text-muted-foreground ml-2">List active DNA communities.</span>
          </li>
        </ul>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold text-foreground">Usage telemetry</h3>
        <p className="text-sm text-muted-foreground">
          Every tool call is logged (tool name, success, latency, error code) to the
          <code className="mx-1 text-xs px-1.5 py-0.5 rounded bg-muted">mcp_tool_events</code>
          table, admin-readable only.
        </p>
        <Button asChild variant="outline" size="sm" className="w-fit">
          <a
            href={`https://supabase.com/dashboard/project/${projectRef}/editor`}
            target="_blank"
            rel="noreferrer"
          >
            Open in Supabase <ExternalLink className="h-3 w-3 ml-1.5" />
          </a>
        </Button>
      </Card>
    </div>
  );
}
