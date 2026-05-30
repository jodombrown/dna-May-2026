import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { requireAdmin } from "../_shared/auth.ts";


const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NewsletterEmailRequest {
  newsletterId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __auth = await requireAdmin(req);
  if (!__auth.ok) return __auth.response;

  try {
    const { newsletterId }: NewsletterEmailRequest = await req.json();

    // Get newsletter details
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', newsletterId)
      .single();

    if (newsletterError || !newsletter) {
      throw new Error('Newsletter not found');
    }

    // Get newsletter author profile
    const { data: author, error: authorError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', newsletter.created_by)
      .single();

    if (authorError || !author) {
      throw new Error('Newsletter author not found');
    }

    // Get followers who have newsletter emails enabled
    const { data: followers, error: followersError } = await supabase
      .rpc('get_newsletter_followers', { newsletter_user_id: newsletter.created_by });

    if (followersError) {
      console.error('Error getting followers:', followersError);
      throw followersError;
    }

    console.log(`Found ${followers?.length || 0} newsletter subscribers`);

    if (!followers || followers.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No subscribers found', 
        recipientCount: 0 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Prepare email content
    const emailSubject = `New Newsletter: ${newsletter.title}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${newsletter.title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: bold; margin: 0; }
            .author { font-size: 16px; margin-top: 10px; opacity: 0.9; }
            .category { background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; display: inline-block; margin-top: 15px; }
            .content { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .summary { font-size: 18px; color: #666; margin-bottom: 25px; font-style: italic; }
            .newsletter-content { white-space: pre-wrap; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; border-top: 1px solid #eee; }
            .unsubscribe { color: #999; font-size: 12px; }
            img { max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${newsletter.title}</h1>
            <div class="author">by ${author.full_name}</div>
            ${newsletter.category ? `<div class="category">${newsletter.category}</div>` : ''}
          </div>
          
          <div class="content">
            ${newsletter.featured_image_url ? `<img src="${newsletter.featured_image_url}" alt="Newsletter featured image">` : ''}
            
            ${newsletter.summary ? `<div class="summary">${newsletter.summary}</div>` : ''}
            
            <div class="newsletter-content">${newsletter.content}</div>
          </div>
          
          <div class="footer">
            <p>This newsletter was sent by ${author.full_name} via DNA (Diaspora Network of Africa)</p>
            <p class="unsubscribe">
              To unsubscribe from newsletters, <a href="${supabaseUrl}/dashboard/profile">update your preferences</a>
            </p>
          </div>
        </body>
      </html>
    `;

    // Send emails in batches
    const batchSize = 50;
    let sentCount = 0;
    const deliveryRecords = [];

    for (let i = 0; i < followers.length; i += batchSize) {
      const batch = followers.slice(i, i + batchSize);
      
      try {
        const emailResponse = await resend.emails.send({
          from: `${author.full_name} <newsletter@resend.dev>`,
          to: batch.map(f => f.email),
          subject: emailSubject,
          html: emailHtml,
        });

        console.log(`Batch ${Math.floor(i/batchSize) + 1} sent successfully:`, emailResponse);
        sentCount += batch.length;

        // Record delivery for each recipient
        for (const follower of batch) {
          deliveryRecords.push({
            newsletter_id: newsletterId,
            recipient_id: follower.user_id,
            status: 'sent'
          });
        }
      } catch (batchError) {
        console.error(`Error sending batch ${Math.floor(i/batchSize) + 1}:`, batchError);
        
        // Record failed delivery
        for (const follower of batch) {
          deliveryRecords.push({
            newsletter_id: newsletterId,
            recipient_id: follower.user_id,
            status: 'failed'
          });
        }
      }
    }

    // Save delivery records
    if (deliveryRecords.length > 0) {
      const { error: deliveryError } = await supabase
        .from('newsletter_deliveries')
        .insert(deliveryRecords);

      if (deliveryError) {
        console.error('Error saving delivery records:', deliveryError);
      }
    }

    // Update newsletter with recipient count
    const { error: updateError } = await supabase
      .from('newsletters')
      .update({ 
        email_recipient_count: sentCount,
        email_sent_at: new Date().toISOString()
      })
      .eq('id', newsletterId);

    if (updateError) {
      console.error('Error updating newsletter:', updateError);
    }

    console.log(`Newsletter sent to ${sentCount} recipients`);

    return new Response(JSON.stringify({ 
      message: 'Newsletter sent successfully', 
      recipientCount: sentCount 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-newsletter function:", error);
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