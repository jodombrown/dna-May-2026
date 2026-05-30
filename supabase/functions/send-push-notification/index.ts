import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireInternal } from "../_shared/auth.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  action?: 'register' | 'send';
  user_id: string;
  title?: string;
  message?: string;
  type?: string;
  action_url?: string;
  actor_avatar_url?: string;
  tag?: string;
  notification_id?: string;
  // For registration
  endpoint?: string;
  subscription_data?: unknown;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const data: PushNotificationRequest = await req.json();
    
    // Handle subscription registration
    if (data.action === 'register' && data.endpoint && data.subscription_data) {
      console.log("Registering push subscription for user:", data.user_id);
      
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: data.user_id,
          endpoint: data.endpoint,
          subscription_data: data.subscription_data,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) {
        console.error("Error storing subscription:", error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, action: 'registered' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Handle sending push notification
    console.log("Sending push notification to user:", data.user_id);

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', data.user_id)
      .eq('is_active', true);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response(
        JSON.stringify({ success: false, error: subError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No active push subscriptions for user");
      return new Response(
        JSON.stringify({ success: false, reason: "no_subscriptions" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check user preferences for push notifications
    const { data: preferences } = await supabase
      .from('adin_preferences')
      .select('in_app_enabled')
      .eq('user_id', data.user_id)
      .single();

    if (preferences && preferences.in_app_enabled === false) {
      console.log("Push notifications disabled for user");
      return new Response(
        JSON.stringify({ success: false, reason: "push_disabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const payload = JSON.stringify({
      title: data.title || 'DNA Notification',
      message: data.message,
      body: data.message,
      type: data.type,
      action_url: data.action_url,
      actor_avatar_url: data.actor_avatar_url,
      tag: data.tag || `dna-${data.type}-${Date.now()}`,
      notification_id: data.notification_id,
    });

    let successCount = 0;
    const failedSubscriptionIds: string[] = [];

    // Get VAPID keys for proper web push signing
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn("VAPID keys not configured - push notifications may not work");
    }

    // Send to all subscriptions
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = subscription.subscription_data as { 
          endpoint: string; 
          keys?: { p256dh: string; auth: string } 
        };
        
        if (!pushSubscription.endpoint) {
          failedSubscriptionIds.push(subscription.id);
          continue;
        }

        // Build headers for Web Push
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'TTL': '86400',
        };

        // Add VAPID authorization if keys are available
        if (vapidPublicKey && vapidPrivateKey && pushSubscription.keys) {
          // For full VAPID signing, we add the public key
          // Note: Full JWT signing would require additional crypto libraries
          headers['Crypto-Key'] = `p256ecdsa=${vapidPublicKey}`;
        }

        const response = await fetch(pushSubscription.endpoint, {
          method: 'POST',
          headers,
          body: payload,
        });
        
        if (response.ok || response.status === 201) {
          successCount++;
          console.log(`Push sent successfully to endpoint`);
        } else if (response.status === 410 || response.status === 404) {
          // Subscription expired or invalid
          failedSubscriptionIds.push(subscription.id);
          console.log(`Subscription expired: ${subscription.id}`);
        } else {
          const responseText = await response.text();
          console.log(`Push returned ${response.status}: ${responseText}`);
        }
      } catch (pushError) {
        console.error("Error sending to subscription:", pushError);
      }
    }

    // Clean up invalid subscriptions
    if (failedSubscriptionIds.length > 0) {
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .in('id', failedSubscriptionIds);
    }

    console.log(`Push notifications sent: ${successCount}/${subscriptions.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: subscriptions.length,
        cleaned: failedSubscriptionIds.length 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in push notification handler:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
