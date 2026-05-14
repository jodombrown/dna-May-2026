import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const recaptchaSecret = Deno.env.get("RECAPTCHA_SECRET_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const params = new URLSearchParams();
    params.append("secret", recaptchaSecret ?? "");
    params.append("response", token);

    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json();
    return !!data.success && (!data.score || data.score >= 0.5);
  } catch (_) {
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const recaptchaToken = body.recaptchaToken;
    if (!recaptchaToken) {
      return new Response(JSON.stringify({ error: "Missing reCAPTCHA token" }), {
        status: 400,
        headers: { ...corsHeaders },
      });
    }
    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
      return new Response(JSON.stringify({ error: "reCAPTCHA failed" }), {
        status: 403,
        headers: { ...corsHeaders },
      });
    }

    const { name, email, linkedin_url, message } = body;

    const esc = (s: unknown) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const adminHtml = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${esc(name)}</p>
      <p><strong>Email:</strong> ${esc(email)}</p>
      <p><strong>LinkedIn URL:</strong> ${esc(linkedin_url)}</p>
      <p><strong>Message:</strong></p>
      <p>${esc(message).replace(/\n/g, "<br/>")}</p>
      <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
    `;

    const userHtml = `
      <h1>Thank you for reaching out!</h1>
      <p>Hi ${esc(name)},</p>
      <p>We've received your message and our team will review it carefully.</p>
      <p><strong>What happens next:</strong></p>
      <ul>
        <li>Our team will review your inquiry within 24-48 hours</li>
        <li>We'll respond to you directly at ${esc(email)}</li>
        <li>For urgent matters, you can also reach us through our social channels</li>
      </ul>
      <p>Thank you for your interest in the Diaspora Network of Africa!</p>
      <p>Best regards,<br>The DNA Team</p>
    `;

    const adminEmailResponse = await resend.emails.send({
      from: "DNA Platform <aweh@diasporanetwork.africa>",
      to: ["aweh@diasporanetwork.africa", "jaune@diasporanetwork.africa"],
      subject: "New Contact Form Submission - DNA Platform",
      html: adminHtml,
    });

    console.log("Admin email sent successfully:", adminEmailResponse);

    const userEmailResponse = await resend.emails.send({
      from: "DNA Platform <aweh@diasporanetwork.africa>",
      to: [email],
      subject: "We received your message - DNA Platform",
      html: userHtml,
    });

    console.log("User confirmation email sent successfully:", userEmailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
