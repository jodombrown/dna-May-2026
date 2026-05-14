import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PulseEvent { id: string; title: string; startsAt: string; }
interface PulseTask {
  id: string;
  title: string;
  spaceTitle: string;
  dueDate: string | null;
  isStalled: boolean;
  isOverdue: boolean;
}
interface PulseNeed {
  id: string;
  title: string;
  spaceTitle: string;
  type: string;
  priority: string;
}

interface BodyShape {
  events: PulseEvent[];
  tasks: PulseTask[];
  needs: PulseNeed[];
  userFirstName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as BodyShape;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "missing key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totals = {
      events: body.events?.length ?? 0,
      tasks: body.tasks?.length ?? 0,
      needs: body.needs?.length ?? 0,
    };

    if (totals.events + totals.tasks + totals.needs === 0) {
      return new Response(
        JSON.stringify({
          headline: "Quiet day across your modules",
          narrative:
            "No urgent events, tasks, or open needs in your spaces right now. Good time to start something.",
          highlights: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const context = JSON.stringify({
      events: body.events.slice(0, 5),
      tasks: body.tasks.slice(0, 5),
      needs: body.needs.slice(0, 5),
    });

    const systemPrompt = [
      "You are DIA, the Diaspora Intelligence Agent.",
      "You write a short cross-module daily brief for a member of the DNA platform (Diaspora Network of Africa).",
      "Tone: warm, direct, never corporate. Never use em-dashes (use a hyphen or restructure).",
      "Keep the headline under 12 words. Narrative under 3 sentences.",
      "Reference items by their natural names. Do not invent items not present in the input.",
    ].join(" ");

    const userPrompt = [
      body.userFirstName ? `User first name: ${body.userFirstName}.` : "",
      `Today across the user's Five C's:`,
      `${totals.events} upcoming event(s), ${totals.tasks} task(s) needing attention, ${totals.needs} open contribution need(s) in their spaces.`,
      `Raw context JSON: ${context}`,
      `Compose a brief and 3-5 highlights pointing to specific items.`,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "build_daily_pulse",
                description: "Return a compact cross-module daily pulse.",
                parameters: {
                  type: "object",
                  properties: {
                    headline: { type: "string" },
                    narrative: { type: "string" },
                    highlights: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          module: {
                            type: "string",
                            enum: ["convene", "collaborate", "contribute"],
                          },
                          refId: { type: "string" },
                          oneLiner: { type: "string" },
                          suggestion: { type: "string" },
                        },
                        required: ["module", "refId", "oneLiner"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["headline", "narrative", "highlights"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "build_daily_pulse" },
          },
        }),
      },
    );

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limited, try again shortly." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted." }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (!response.ok) {
      const text = await response.text();
      console.error("dia-daily-pulse gateway error", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const json = await response.json();
    const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments
      ? JSON.parse(toolCall.function.arguments)
      : null;

    if (!args) {
      return new Response(
        JSON.stringify({ error: "no tool output" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("dia-daily-pulse error", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "unknown",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
