
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { escapeHtml } from "../_shared/auth.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      age_group, 
      gender, 
      current_country, 
      country_of_origin, 
      education, 
      occupation,
      connection_methods,
      participation_frequency,
      challenges,
      platform_interest,
      valuable_features,
      motivation,
      concerns,
      follow_up,
      first_name,
      last_name,
      email,
      additional_comments,
      recipient_email 
    } = await req.json()

    const htmlContent = `
      <h2>DNA Market Validation Survey Response</h2>
      
      <h3>Section 1: About You</h3>
      <p><strong>Age Group:</strong> ${age_group}</p>
      <p><strong>Gender:</strong> ${gender}</p>
      <p><strong>Current Country:</strong> ${current_country}</p>
      <p><strong>Country of Origin:</strong> ${country_of_origin}</p>
      <p><strong>Education:</strong> ${education}</p>
      <p><strong>Occupation:</strong> ${occupation}</p>
      
      <h3>Section 2: Digital Habits & Community Engagement</h3>
      <p><strong>Connection Methods:</strong> ${connection_methods.join(', ')}</p>
      <p><strong>Participation Frequency:</strong> ${participation_frequency}</p>
      
      <h3>Section 3: Platform Needs & Interest</h3>
      <p><strong>Challenges:</strong> ${challenges}</p>
      <p><strong>Platform Interest:</strong></p>
      <ul>
        <li>Connect: ${platform_interest.connect}/5</li>
        <li>Collaborate: ${platform_interest.collaborate}/5</li>
        <li>Contribute: ${platform_interest.contribute}/5</li>
      </ul>
      <p><strong>Valuable Features:</strong> ${valuable_features.join(', ')}</p>
      <p><strong>Motivation:</strong> ${motivation}</p>
      <p><strong>Concerns:</strong> ${concerns}</p>
      
      <h3>Section 4: Final Thoughts</h3>
      <p><strong>Follow-up Interest:</strong> ${follow_up ? 'Yes' : 'No'}</p>
      ${follow_up ? `
        <p><strong>First Name:</strong> ${first_name}</p>
        <p><strong>Last Name:</strong> ${last_name}</p>
        <p><strong>Email:</strong> ${email}</p>
      ` : ''}
      <p><strong>Additional Comments:</strong> ${additional_comments}</p>
      
      <hr>
      <p><em>Survey submitted via DNA Platform</em></p>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'DNA Platform <noreply@roadmap.africa>',
        to: ['aweh@diasporanetwork.africa', 'jaune@diasporanetwork.africa'],
        subject: 'New DNA Market Validation Survey Response',
        html: htmlContent,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      const error = await res.text()
      return new Response(JSON.stringify({ success: false, error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
