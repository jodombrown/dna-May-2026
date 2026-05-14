import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://ybhssuehmfnxrzneobok.supabase.co";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseAdmin = SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY) : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MagicLinkRequest {
  email: string;
  magicLink?: string;
  fullName?: string;
  redirectTo?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated admin caller
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: userRes.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body: MagicLinkRequest = await req.json();
    const email = (body.email || '').trim();
    const fullName = body.fullName;
    const redirectTo = body.redirectTo || 'https://diasporanetwork.africa/auth/callback';

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Generate magic link if not provided
    let magicLink = body.magicLink;
    if (!magicLink) {
      if (!supabaseAdmin) {
        throw new Error('Service role not configured for magic link generation');
      }
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo }
      });
      if (error) throw error;
      magicLink = (data as any)?.properties?.action_link || (data as any)?.properties?.email_otp_link;
      if (!magicLink) {
        throw new Error('Failed to generate magic link');
      }
    }

    const emailResponse = await resend.emails.send({
      from: "DNA Platform <noreply@diasporanetwork.africa>",
      to: [email],
      subject: "Your secure access link to DNA Platform",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #065f46, #059669); color: white; padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">DNA Platform</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Diaspora Network of Africa</p>
          </div>
          
          <div style="padding: 32px;">
            <h2 style="color: #065f46; margin: 0 0 16px 0;">Welcome ${fullName ? fullName : 'Admin'}!</h2>
            
            <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
              Click the secure link below to access your DNA Platform admin account. This link is valid for 24 hours.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${magicLink}" 
                 style="background: #059669; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Access DNA Platform
              </a>
            </div>
            
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.5;">
                <strong>Security Note:</strong> This link is unique to you and should not be shared. 
                If you didn't request this access, please ignore this email.
              </p>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 32px 0 0 0;">
              This email was sent from the DNA Platform. If you have questions, please contact our admin team.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Magic link email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending magic link email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);