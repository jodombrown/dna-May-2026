
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { requireUser, escapeHtml } from "../_shared/auth.ts";


const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __auth = await requireUser(req);
  if (!__auth.ok) return __auth.response;

  try {
    const { email, resetUrl }: PasswordResetRequest = await req.json();

    // Validate resetUrl against allowed domains to prevent phishing
    const ALLOWED_HOSTS = ['diasporanetwork.africa', 'www.diasporanetwork.africa', 'diaspora-network-of-africa.lovable.app'];
    let safeResetUrl: string;
    try {
      const u = new URL(resetUrl);
      if (u.protocol !== 'https:' || !ALLOWED_HOSTS.some(h => u.hostname === h || u.hostname.endsWith(`.${h}`))) {
        throw new Error('invalid host');
      }
      safeResetUrl = u.toString();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid resetUrl: must be https on an allowed domain' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const escapedUrl = escapeHtml(safeResetUrl);

    const emailResponse = await resend.emails.send({
      from: "DNA Platform <noreply@dnaplatform.com>",
      to: [email],
      subject: "Reset Your DNA Platform Password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password - DNA Platform</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2D5016 0%, #8B4513 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">DNA Platform</h1>
              <p style="color: #f0f0f0; margin: 10px 0 0 0;">Diaspora Network of Africa</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none;">
              <h2 style="color: #2D5016; margin-top: 0;">Reset Your Password</h2>
              
              <p>Hello,</p>
              
              <p>We received a request to reset your password for your DNA Platform account. If you didn't make this request, you can safely ignore this email.</p>
              
              <p>To reset your password, click the button below:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${escapedUrl}" 
                   style="background: #CD853F; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666; font-size: 14px;">${escapedUrl}</p>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
                This link will expire in 24 hours for security reasons.
              </p>
              
              <p style="color: #666; font-size: 14px;">
                Best regards,<br>
                The DNA Platform Team
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
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
