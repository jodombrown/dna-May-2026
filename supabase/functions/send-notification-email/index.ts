import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUser } from "../_shared/auth.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  action_url?: string;
  actor_name?: string;
  actor_avatar_url?: string;
}

// Map notification types to preference fields
const notificationTypeToPreference: Record<string, string> = {
  connection_request: 'email_connections',
  connection_accepted: 'email_connections',
  comment: 'email_comments',
  reaction: 'email_reactions',
  post_like: 'email_reactions',
  mention: 'email_mentions',
  message: 'email_messages',
  new_message: 'email_messages',
  event_reminder: 'email_events',
  event_invite: 'email_events',
  story_published: 'email_stories',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const getNotificationIcon = (type: string): string => {
  const icons: Record<string, string> = {
    connection_request: '🤝',
    connection_accepted: '✅',
    comment: '💬',
    reaction: '👍',
    message: '✉️',
    mention: '@',
    event_reminder: '📅',
    post_like: '👍',
    story_published: '📖',
    welcome: '👋',
    default: '🔔'
  };
  return icons[type] || icons.default;
};

const generateEmailHtml = (data: NotificationEmailRequest, userName: string, unsubscribeToken?: string): string => {
  const icon = getNotificationIcon(data.notification_type);
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  
  // Build unsubscribe URLs
  const unsubscribeAllUrl = unsubscribeToken 
    ? `${supabaseUrl}/functions/v1/unsubscribe-email?token=${unsubscribeToken}&type=all`
    : 'https://diasporanetwork.africa/dna/settings/notifications';
  
  const unsubscribeTypeMap: Record<string, string> = {
    connection_request: 'connections',
    connection_accepted: 'connections',
    comment: 'comments',
    reaction: 'reactions',
    post_like: 'reactions',
    mention: 'mentions',
    message: 'messages',
    new_message: 'messages',
    event_reminder: 'events',
    event_invite: 'events',
    story_published: 'stories',
  };
  
  const unsubscribeType = unsubscribeTypeMap[data.notification_type] || 'all';
  const unsubscribeThisTypeUrl = unsubscribeToken 
    ? `${supabaseUrl}/functions/v1/unsubscribe-email?token=${unsubscribeToken}&type=${unsubscribeType}`
    : unsubscribeAllUrl;
  
  const actionButton = data.action_url ? `
    <tr>
      <td style="padding: 24px 0;">
        <a href="${data.action_url}" 
           style="display: inline-block; background: linear-gradient(135deg, #D97706 0%, #B45309 100%); 
                  color: white; padding: 14px 32px; border-radius: 8px; 
                  text-decoration: none; font-weight: 600; font-size: 16px;
                  box-shadow: 0 4px 14px rgba(217, 119, 6, 0.3);">
          View on DNA
        </a>
      </td>
    </tr>
  ` : '';

  const actorSection = data.actor_name ? `
    <tr>
      <td style="padding-bottom: 16px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align: middle;">
              ${data.actor_avatar_url 
                ? `<img src="${data.actor_avatar_url}" alt="${data.actor_name}" 
                     style="width: 48px; height: 48px; border-radius: 50%; margin-right: 12px; object-fit: cover;">`
                : `<div style="width: 48px; height: 48px; border-radius: 50%; margin-right: 12px; 
                         background: linear-gradient(135deg, #D97706 0%, #B45309 100%); 
                         display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                     ${data.actor_name.charAt(0).toUpperCase()}
                   </div>`
              }
            </td>
            <td style="vertical-align: middle;">
              <span style="font-weight: 600; color: #1a1a1a;">${data.actor_name}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f5;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
                  <img src="https://ybhssuehmfnxrzneobok.supabase.co/storage/v1/object/public/assets/dna-logo-white.png" 
                       alt="DNA" style="height: 40px; margin-bottom: 16px;" 
                       onerror="this.style.display='none'">
                  <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">
                    Diaspora Network of Africa
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="background: white; padding: 40px 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    
                    <!-- Greeting -->
                    <tr>
                      <td style="padding-bottom: 24px;">
                        <p style="margin: 0; color: #71717a; font-size: 14px;">Hello ${userName},</p>
                      </td>
                    </tr>
                    
                    <!-- Notification Icon & Title -->
                    <tr>
                      <td style="padding-bottom: 16px;">
                        <span style="font-size: 32px; margin-right: 12px;">${icon}</span>
                        <span style="font-size: 20px; font-weight: 700; color: #1a1a1a;">${data.title}</span>
                      </td>
                    </tr>
                    
                    <!-- Actor Info -->
                    ${actorSection}
                    
                    <!-- Message -->
                    <tr>
                      <td style="padding-bottom: 24px;">
                        <p style="margin: 0; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                          ${data.message}
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Action Button -->
                    ${actionButton}
                    
                    <!-- Divider -->
                    <tr>
                      <td style="padding: 24px 0;">
                        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0;">
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="text-align: center;">
                        <p style="margin: 0 0 8px 0; color: #71717a; font-size: 12px;">
                          You're receiving this because you have email notifications enabled.
                        </p>
                        <p style="margin: 0 0 8px 0; color: #71717a; font-size: 12px;">
                          <a href="https://diasporanetwork.africa/dna/settings/notifications" 
                             style="color: #D97706; text-decoration: none;">
                            Manage preferences
                          </a>
                          &nbsp;|&nbsp;
                          <a href="${unsubscribeThisTypeUrl}" 
                             style="color: #71717a; text-decoration: underline;">
                            Unsubscribe from these
                          </a>
                          &nbsp;|&nbsp;
                          <a href="${unsubscribeAllUrl}" 
                             style="color: #71717a; text-decoration: underline;">
                            Unsubscribe from all
                          </a>
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
              
              <!-- Brand Footer -->
              <tr>
                <td style="padding: 24px; text-align: center;">
                  <p style="margin: 0; color: #71717a; font-size: 12px;">
                    © ${new Date().getFullYear()} Diaspora Network of Africa. All rights reserved.
                  </p>
                  <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 11px;">
                    Mobilizing the global African diaspora for Africa's progress.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __auth = requireInternal(req);
  if (!__auth.ok) return __auth.response;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: NotificationEmailRequest = await req.json();
    console.log("Received notification email request:", data);

    // Get user's email and preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name, username')
      .eq('id', data.user_id)
      .single();

    if (profileError || !profile?.email) {
      console.log("User profile not found or no email:", profileError);
      return new Response(
        JSON.stringify({ success: false, error: "User not found or no email" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check user's email notification preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('adin_preferences')
      .select('email_enabled, notification_frequency, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone, unsubscribe_token, email_connections, email_comments, email_reactions, email_mentions, email_messages, email_events, email_stories')
      .eq('user_id', data.user_id)
      .single();

    // Default to enabled if no preferences found
    const emailEnabled = preferences?.email_enabled ?? true;
    const frequency = preferences?.notification_frequency ?? 'normal';

    if (!emailEnabled || frequency === 'never') {
      console.log("Email notifications disabled for user");
      return new Response(
        JSON.stringify({ success: false, reason: "email_disabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check granular notification type preference
    const prefField = notificationTypeToPreference[data.notification_type];
    if (prefField && preferences) {
      const typeEnabled = (preferences as any)[prefField] ?? true;
      if (!typeEnabled) {
        console.log(`Email notifications for ${data.notification_type} disabled for user`);
        return new Response(
          JSON.stringify({ success: false, reason: `${data.notification_type}_disabled` }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Check quiet hours
    if (preferences?.quiet_hours_enabled) {
      const now = new Date();
      const userTimezone = preferences.timezone || 'UTC';
      const currentHour = parseInt(now.toLocaleString('en-US', { timeZone: userTimezone, hour: '2-digit', hour12: false }));
      const startHour = parseInt(preferences.quiet_hours_start?.split(':')[0] || '22');
      const endHour = parseInt(preferences.quiet_hours_end?.split(':')[0] || '7');

      const isInQuietHours = startHour > endHour
        ? (currentHour >= startHour || currentHour < endHour)
        : (currentHour >= startHour && currentHour < endHour);

      if (isInQuietHours) {
        console.log("User is in quiet hours, skipping email");
        return new Response(
          JSON.stringify({ success: false, reason: "quiet_hours" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Generate email HTML
    const userName = profile.full_name || profile.username || 'DNA Member';
    const unsubscribeToken = preferences?.unsubscribe_token;
    const htmlContent = generateEmailHtml(data, userName, unsubscribeToken);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "DNA Platform <notifications@diasporanetwork.africa>",
      to: [profile.email],
      subject: `${getNotificationIcon(data.notification_type)} ${data.title}`,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
