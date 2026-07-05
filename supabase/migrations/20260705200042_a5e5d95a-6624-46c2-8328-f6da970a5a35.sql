CREATE TABLE public.mcp_tool_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name text NOT NULL,
  success boolean NOT NULL,
  latency_ms integer NOT NULL CHECK (latency_ms >= 0),
  error_code text,
  error_message text,
  client_id text,
  input_summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mcp_tool_events_tool_name_created_at_idx
  ON public.mcp_tool_events (tool_name, created_at DESC);
CREATE INDEX mcp_tool_events_created_at_idx
  ON public.mcp_tool_events (created_at DESC);

GRANT SELECT ON public.mcp_tool_events TO authenticated;
GRANT ALL ON public.mcp_tool_events TO service_role;

ALTER TABLE public.mcp_tool_events ENABLE ROW LEVEL SECURITY;

-- Only admins can read telemetry
CREATE POLICY "Admins can read mcp tool events"
  ON public.mcp_tool_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No client-side writes; edge function uses service_role which bypasses RLS.
