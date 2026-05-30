
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getEmailContent } from "./emailTemplates.ts";
import { EmailService } from "./emailService.ts";
import { requireInternal } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UniversalEmailRequest {
  formType: string;
  formData: any;
  userEmail?: string;
}

// Enhanced input validation and sanitization
const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>]/g, '')
    .trim();
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateFormData = (formData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!formData.name || sanitizeInput(formData.name).length === 0) {
    errors.push('Name is required');
  }
  
  if (!formData.email || !validateEmail(sanitizeInput(formData.email))) {
    errors.push('Valid email is required');
  }
  
  if (formData.name && sanitizeInput(formData.name).length > 100) {
    errors.push('Name too long');
  }
  
  if (formData.message && sanitizeInput(formData.message).length > 1000) {
    errors.push('Message too long');
  }
  
  return { isValid: errors.length === 0, errors };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formType, formData, userEmail }: UniversalEmailRequest = await req.json();
    
    // Validate and sanitize form data
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: `Validation failed: ${validation.errors.join(', ')}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Sanitize all form inputs
    const sanitizedFormData = {
      ...formData,
      name: sanitizeInput(formData.name),
      email: sanitizeInput(formData.email),
      message: sanitizeInput(formData.message || ''),
      company: sanitizeInput(formData.company || ''),
      role: sanitizeInput(formData.role || ''),
      experience: sanitizeInput(formData.experience || ''),
      motivation: sanitizeInput(formData.motivation || ''),
      linkedin_url: sanitizeInput(formData.linkedin_url || ''),
      linkedin: sanitizeInput(formData.linkedin || ''),
      interest: sanitizeInput(formData.interest || ''),
      organization: sanitizeInput(formData.organization || ''),
      stakeholderType: sanitizeInput(formData.stakeholderType || '')
    };
    
    // Initialize email service
    const emailService = new EmailService({
      resendApiKey: Deno.env.get("RESEND_API_KEY")!,
      fromEmail: "DNA Platform <aweh@diasporanetwork.africa>",
      adminEmail: "aweh@diasporanetwork.africa"
    });

    // Get email content based on form type using sanitized data
    const emailContent = getEmailContent(formType, sanitizedFormData);

    // Set admin recipients - always send to both emails
    const adminRecipients = ['aweh@diasporanetwork.africa', 'jaune@diasporanetwork.africa'];

    // Send email to admin(s)
    const adminEmailResponse = await emailService.sendAdminEmail(emailContent, adminRecipients);
    console.log("Admin email sent successfully:", adminEmailResponse);

    // Send confirmation email to user if email provided
    let userEmailResponse = null;
    if (userEmail && validateEmail(sanitizeInput(userEmail))) {
      userEmailResponse = await emailService.sendUserConfirmationEmail(sanitizeInput(userEmail), emailContent);
      console.log("User confirmation email sent successfully:", userEmailResponse);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      adminEmailId: adminEmailResponse.data?.id,
      userEmailSent: !!userEmail 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in universal email function:", error);
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
