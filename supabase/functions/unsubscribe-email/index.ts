import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UnsubscribeRequest {
  token: string;
  type?: 'all' | 'connections' | 'comments' | 'reactions' | 'mentions' | 'messages' | 'events' | 'stories';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Support both GET (for email link clicks) and POST (for UI actions)
    let token: string;
    let unsubType: string = 'all';

    if (req.method === "GET") {
      const url = new URL(req.url);
      token = url.searchParams.get('token') || '';
      unsubType = url.searchParams.get('type') || 'all';
    } else {
      const body: UnsubscribeRequest = await req.json();
      token = body.token;
      unsubType = body.type || 'all';
    }

    if (!token) {
      console.log("No unsubscribe token provided");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid unsubscribe token" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Find user by unsubscribe token
    const { data: preferences, error: findError } = await supabase
      .from('dia_preferences')
      .select('user_id, email_enabled, email_connections, email_comments, email_reactions, email_mentions, email_messages, email_events, email_stories')
      .eq('unsubscribe_token', token)
      .single();

    if (findError || !preferences) {
      console.log("Invalid or expired unsubscribe token:", findError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired unsubscribe token" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update preferences based on unsubscribe type
    let updateData: Record<string, boolean> = {};
    
    switch (unsubType) {
      case 'all':
        updateData = { email_enabled: false };
        break;
      case 'connections':
        updateData = { email_connections: false };
        break;
      case 'comments':
        updateData = { email_comments: false };
        break;
      case 'reactions':
        updateData = { email_reactions: false };
        break;
      case 'mentions':
        updateData = { email_mentions: false };
        break;
      case 'messages':
        updateData = { email_messages: false };
        break;
      case 'events':
        updateData = { email_events: false };
        break;
      case 'stories':
        updateData = { email_stories: false };
        break;
      default:
        updateData = { email_enabled: false };
    }

    const { error: updateError } = await supabase
      .from('dia_preferences')
      .update(updateData)
      .eq('unsubscribe_token', token);

    if (updateError) {
      console.error("Error updating preferences:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update preferences" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Successfully unsubscribed user from ${unsubType} emails`);

    // For GET requests (email link clicks), return an HTML page
    if (req.method === "GET") {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unsubscribed - DNA Platform</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 16px;
              padding: 48px;
              max-width: 500px;
              text-align: center;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .icon { font-size: 48px; margin-bottom: 24px; }
            h1 { color: #1a1a1a; margin: 0 0 16px 0; font-size: 24px; }
            p { color: #71717a; margin: 0 0 24px 0; line-height: 1.6; }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #D97706 0%, #B45309 100%);
              color: white;
              padding: 14px 32px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
            }
            .button:hover { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>You've Been Unsubscribed</h1>
            <p>
              ${unsubType === 'all' 
                ? "You will no longer receive email notifications from DNA." 
                : `You will no longer receive ${unsubType} email notifications.`}
            </p>
            <p style="font-size: 14px;">
              Changed your mind? You can re-enable notifications anytime in your settings.
            </p>
            <a href="https://diasporanetwork.africa/dna/settings/notifications" class="button">
              Manage Preferences
            </a>
          </div>
        </body>
        </html>
      `;
      return new Response(html, { 
        status: 200, 
        headers: { "Content-Type": "text/html", ...corsHeaders } 
      });
    }

    return new Response(
      JSON.stringify({ success: true, unsubscribed_from: unsubType }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in unsubscribe function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
