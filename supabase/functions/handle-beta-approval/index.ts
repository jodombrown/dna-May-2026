import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { requireAdmin } from "../_shared/auth.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApprovalRequest {
  applicationId: string;
  action: 'approve' | 'reject';
  adminNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Require authenticated admin user
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;
    const user = { id: auth.userId };

    const { applicationId, action, adminNotes }: ApprovalRequest = await req.json();

    if (action === 'approve') {
      // Approve application and generate magic link
      const { data: magicLinkData, error: approvalError } = await supabase
        .rpc('approve_beta_application', {
          application_id: applicationId,
          admin_id: user.id
        });

      if (approvalError) throw approvalError;

      // Get application details for email
      const { data: application, error: appError } = await supabase
        .from('beta_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;

      // Send approval email with magic link
      const magicLink = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?type=beta_signup&token=${magicLinkData[0].magic_link_token}&redirect_to=${encodeURIComponent('https://ybhssuehmfnxrzneobok.supabase.co/beta-signup-complete')}`;

      const { error: emailError } = await supabase.functions.invoke('send-universal-email', {
        body: {
          formType: 'beta-approval',
          formData: {
            ...application,
            magicLink,
            expiresAt: magicLinkData[0].expires_at
          },
          userEmail: application.email
        }
      });

      if (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the approval if email fails
      }

    } else if (action === 'reject') {
      // Reject application
      const { error: rejectionError } = await supabase
        .from('beta_applications')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (rejectionError) throw rejectionError;

      // Get application details for rejection email
      const { data: application, error: appError } = await supabase
        .from('beta_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;

      // Send rejection email
      const { error: emailError } = await supabase.functions.invoke('send-universal-email', {
        body: {
          formType: 'beta-rejection',
          formData: {
            ...application,
            adminNotes
          },
          userEmail: application.email
        }
      });

      if (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in beta approval function:", error);
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