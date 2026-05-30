import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@2.0.0";
import { requireInternal, escapeHtml } from "../_shared/auth.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  userEmail: string;
  userName: string;
  selectedPillars?: string[];
  completedSteps?: string[];
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const generateWelcomeEmailHTML = (data: {
  userName: string;
  selectedPillars: string[];
  completedSteps: string[];
  profileUrl: string;
  dashboardUrl: string;
}) => {
  const { userName, selectedPillars, completedSteps, profileUrl, dashboardUrl } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to DNA - Diaspora Network of Africa</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px 32px; text-align: center; }
        .logo { color: #ffffff; font-size: 28px; font-weight: bold; margin-bottom: 8px; }
        .tagline { color: #dcfce7; font-size: 16px; margin: 0; }
        .content { padding: 40px 32px; }
        .greeting { font-size: 24px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
        .section { margin-bottom: 32px; }
        .section-title { font-size: 18px; font-weight: 600; color: #16a34a; margin-bottom: 12px; }
        .pillars { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .pillar { background-color: #dcfce7; color: #15803d; padding: 6px 12px; border-radius: 16px; font-size: 14px; font-weight: 500; }
        .steps { list-style: none; padding: 0; margin: 0; }
        .step { padding: 12px 0; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; }
        .step:last-child { border-bottom: none; }
        .step-icon { width: 20px; height: 20px; background-color: #16a34a; border-radius: 50%; margin-right: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; }
        .cta-section { background-color: #f9fafb; padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0; }
        .cta-button { display: inline-block; background-color: #16a34a; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 8px; }
        .cta-button:hover { background-color: #15803d; }
        .footer { background-color: #f3f4f6; padding: 24px 32px; text-align: center; color: #6b7280; font-size: 14px; }
        .social-links { margin: 16px 0; }
        .social-link { color: #16a34a; text-decoration: none; margin: 0 8px; }
        @media (max-width: 600px) {
          .container { margin: 0 16px; }
          .content, .header { padding: 24px 20px; }
          .pillars { justify-content: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo">DNA</div>
          <p class="tagline">Diaspora Network of Africa</p>
        </div>

        <!-- Main Content -->
        <div class="content">
          <h1 class="greeting">Welcome to DNA, ${userName}! 🎉</h1>
          
          <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
            Congratulations on completing your onboarding! You've just joined a vibrant community of 
            African diasporans and allies committed to connecting, collaborating, and contributing to 
            Africa's development through innovation and entrepreneurship.
          </p>

          <!-- Your DNA Journey -->
          <div class="section">
            <h2 class="section-title">🌟 Your DNA Journey</h2>
            <p style="margin-bottom: 16px; color: #4b5563;">You've chosen to focus on these areas:</p>
            <div class="pillars">
              ${selectedPillars.map(pillar => `<span class="pillar">${pillar}</span>`).join('')}
            </div>
          </div>

          <!-- Completed Setup -->
          <div class="section">
            <h2 class="section-title">✅ What You've Accomplished</h2>
            <ul class="steps">
              ${completedSteps.map(step => `
                <li class="step">
                  <div class="step-icon">✓</div>
                  <span>${step}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <!-- Next Steps -->
          <div class="cta-section">
            <h2 style="margin-top: 0; color: #1f2937;">🚀 Ready to Get Started?</h2>
            <p style="margin-bottom: 20px; color: #4b5563;">
              Your profile is set up and you're ready to explore the DNA community. Here are some great next steps:
            </p>
            <a href="${dashboardUrl}" class="cta-button">Explore Your Dashboard</a>
            <a href="${profileUrl}" class="cta-button">Complete Your Profile</a>
          </div>

          <!-- Community Guidelines -->
          <div class="section">
            <h2 class="section-title">🤝 Community Guidelines</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              DNA thrives on Ubuntu - the belief that "I am because we are." We're here to support each other's 
              growth and Africa's development. Be respectful, collaborative, and authentic in all your interactions.
            </p>
          </div>

          <!-- Contact -->
          <div class="section">
            <h2 class="section-title">💬 Need Help?</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Our community team is here to help you get the most out of your DNA experience. 
              Don't hesitate to reach out if you have questions or need support.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="social-links">
            <a href="#" class="social-link">LinkedIn</a> |
            <a href="#" class="social-link">Twitter</a> |
            <a href="#" class="social-link">Website</a>
          </div>
          <p style="margin: 8px 0;">
            <strong>DNA - Diaspora Network of Africa</strong><br>
            Connecting minds, Building futures, Transforming Africa
          </p>
          <p style="margin: 8px 0; font-size: 12px;">
            You're receiving this email because you just completed onboarding for DNA.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __auth = requireInternal(req);
  if (!__auth.ok) return __auth.response;

  try {
    const { userId, userEmail, userName, selectedPillars = [], completedSteps = [] }: WelcomeEmailRequest = await req.json();

    if (!userId || !userEmail || !userName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, userEmail, userName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile for additional context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Generate email content
    const emailData = {
      userName: userName,
      selectedPillars: selectedPillars.length > 0 ? selectedPillars : ['Connect', 'Collaborate', 'Contribute'],
      completedSteps: completedSteps.length > 0 ? completedSteps : [
        'Created your DNA profile',
        'Selected your focus areas',
        'Set up your preferences',
        'Joined the community'
      ],
      profileUrl: `${supabaseUrl.replace('.supabase.co', '')}/app/profile`,
      dashboardUrl: `${supabaseUrl.replace('.supabase.co', '')}/app`
    };

    const htmlContent = generateWelcomeEmailHTML(emailData);

    // Send welcome email
    const emailResponse = await resend.emails.send({
      from: "DNA Community <welcome@diasporanetwork.africa>",
      to: [userEmail],
      subject: `Welcome to DNA, ${userName}! 🌍 Your journey begins now`,
      html: htmlContent,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    // Do not mutate onboarding status here; the client owns completion state
    // This avoids race conditions and duplication with the onboarding flow.


    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Welcome email sent successfully",
        emailId: emailResponse.data?.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send welcome email", 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);