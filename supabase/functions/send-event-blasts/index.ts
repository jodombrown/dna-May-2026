import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Blast = {
  id: string;
  event_id: string;
  subject: string;
  body_markdown: string;
  segment: any;
  scheduled_for: string | null;
  sent_at: string | null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  const resendKey = Deno.env.get('RESEND_API_KEY') || '';
  const fromEmail = Deno.env.get('EMAIL_FROM') || '';
  if (!resendKey || !fromEmail) {
    return new Response(JSON.stringify({ error: 'Missing RESEND_API_KEY or EMAIL_FROM' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
  const resend = new Resend(resendKey);

  try {
    const { eventId } = await req.json().catch(() => ({ eventId: null }));

    // Require authentication. Allow either:
    //  - Internal/cron callers presenting the service-role key
    //  - Authenticated admin users
    //  - Authenticated organizers of the target event (eventId required)
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const isServiceRole = !!token && !!serviceRoleKey && token === serviceRoleKey;

    if (!isServiceRole) {
      if (!token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
      }
      const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !userRes?.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
      }
      const callerId = userRes.user.id;
      const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: callerId, _role: 'admin' });

      if (!isAdmin) {
        if (!eventId) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 });
        }
        const { data: ev } = await supabase
          .from('events')
          .select('organizer_id, created_by')
          .eq('id', eventId)
          .maybeSingle();
        const ownerId = (ev as { organizer_id?: string; created_by?: string } | null)?.organizer_id
          ?? (ev as { organizer_id?: string; created_by?: string } | null)?.created_by;
        if (!ownerId || ownerId !== callerId) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 });
        }
      }
    }

    let blasts: Blast[] = [];
    const nowIso = new Date().toISOString();

    if (eventId) {
      const { data, error } = await supabase
        .from('event_blasts')
        .select('id, event_id, subject, body_markdown, segment, scheduled_for, sent_at')
        .eq('event_id', eventId)
        .is('sent_at', null)
        .or(`scheduled_for.is.null,scheduled_for.lte.${nowIso}`)
        .limit(50);
      if (error) throw error;
      blasts = data as Blast[];
    } else {
      // Listing all due blasts is restricted to internal/admin callers
      if (!isServiceRole) {
        const { data: userRes2 } = await supabase.auth.getUser(token);
        const { data: isAdmin2 } = await supabase.rpc('has_role', {
          _user_id: userRes2?.user?.id, _role: 'admin',
        });
        if (!isAdmin2) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 });
        }
      }
      const { data, error } = await supabase
        .from('event_blasts')
        .select('id, event_id, subject, body_markdown, segment, scheduled_for, sent_at')
        .is('sent_at', null)
        .lte('scheduled_for', nowIso)
        .limit(50);
      if (error) throw error;
      blasts = data as Blast[];
    }

    const results: any[] = [];

    for (const blast of blasts) {
      const seg = (blast.segment || {}) as { type?: string; status?: string; partyId?: string; role?: string };
      const segType = (seg.type ?? seg.status ?? 'all') as string;

      // Relationships Phase 1 (BD411/423): audience is a Party or a role
      // category rather than an event_attendees segment. Parties are not DNA
      // members and carry their own email directly — resolve and send to
      // that address, skipping the user_id/profiles lookup path below.
      if (segType === 'party' || segType === 'role') {
        let partyEmails: string[] = [];
        if (segType === 'party' && seg.partyId) {
          const { data: party, error: partyErr } = await supabase
            .from('parties')
            .select('email')
            .eq('id', seg.partyId)
            .maybeSingle();
          if (partyErr) throw partyErr;
          if (party?.email) partyEmails = [party.email];
        } else if (segType === 'role' && seg.role) {
          const { data: rows, error: rowsErr } = await supabase
            .from('event_engagements')
            .select('parties(email), event_engagement_roles!inner(role)')
            .eq('event_id', blast.event_id)
            .eq('event_engagement_roles.role', seg.role);
          if (rowsErr) throw rowsErr;
          partyEmails = Array.from(new Set(
            ((rows || []) as any[])
              .map((r) => r.parties?.email)
              .filter((e: string | null | undefined): e is string => !!e),
          ));
        }

        const isHtmlParty = (blast.body_markdown || '').trim().startsWith('<');
        const bodyHtmlParty = isHtmlParty ? (blast.body_markdown || '') : mdToHtml(blast.body_markdown || '');
        const htmlParty = `<div style="font-family:Inter,system-ui,sans-serif;line-height:1.6;">
          <h2>${escapeHtml(blast.subject)}</h2>
          <div>${bodyHtmlParty}</div>
        </div>`;

        const partySendResults: any[] = [];
        for (const to of partyEmails) {
          try {
            const res = await resend.emails.send({ from: fromEmail, to: [to], subject: blast.subject, html: htmlParty });
            partySendResults.push({ to, id: (res as any).id || null });
          } catch (e) {
            console.error('send error', e);
            partySendResults.push({ to, error: String(e) });
          }
        }

        const { error: updErrParty } = await supabase
          .from('event_blasts')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', blast.id);
        if (updErrParty) console.error('update blast sent err', updErrParty);

        results.push({ blastId: blast.id, recipients: partyEmails.length, sendResults: partySendResults });
        continue;
      }

      // Collect recipient user IDs based on segment
      let userIds: string[] = [];

      if (segType === 'waitlist') {
        const { data: wl, error: wlErr } = await supabase
          .from('event_waitlist')
          .select('user_id')
          .eq('event_id', blast.event_id);
        if (wlErr) throw wlErr;
        userIds = Array.from(new Set((wl || []).map((w: any) => w.user_id)));
      } else {
        const statuses = segType === 'all' ? ['going', 'pending']
          : segType === 'confirmed' ? ['going']
          : [segType];
        const { data: regsList, error: regsListErr } = await supabase
          .from('event_orders')
          .select('user_id, status')
          .eq('event_id', blast.event_id)
          .in('status', statuses);
        if (regsListErr) throw regsListErr;
        userIds = Array.from(new Set(((regsList || []) as any[]).map(r => r.user_id)));
      }

      let emails: string[] = [];
      if (userIds.length) {
        const { data: profiles, error: pErr } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);
        if (pErr) throw pErr;
        emails = (profiles || []).map((p: any) => p.email).filter((e: string) => !!e);
      }

      const isHtml = (blast.body_markdown || '').trim().startsWith('<');
      const bodyHtml = isHtml ? (blast.body_markdown || '') : mdToHtml(blast.body_markdown || '');
      const html = `<div style="font-family:Inter,system-ui,sans-serif;line-height:1.6;">
        <h2>${escapeHtml(blast.subject)}</h2>
        <div>${bodyHtml}</div>
      </div>`;

      // One email API call per recipient, sequentially awaited with no
      // cap, risked the function's execution timeout for any blast with a
      // large segment and hit Resend's rate limits with no backoff.
      // Batch with bounded concurrency, same pattern as messages-cleanup.
      const SEND_CONCURRENCY = 10;
      const sendResults: any[] = [];
      for (let i = 0; i < emails.length; i += SEND_CONCURRENCY) {
        const chunk = emails.slice(i, i + SEND_CONCURRENCY);
        const chunkResults = await Promise.all(chunk.map(async (to) => {
          try {
            const res = await resend.emails.send({ from: fromEmail, to: [to], subject: blast.subject, html });
            return { to, id: (res as any).id || null };
          } catch (e) {
            console.error('send error', e);
            return { to, error: String(e) };
          }
        }));
        sendResults.push(...chunkResults);
      }

      // Mark blast sent
      const { error: updErr } = await supabase
        .from('event_blasts')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', blast.id);
      if (updErr) console.error('update blast sent err', updErr);

      results.push({ blastId: blast.id, recipients: emails.length, sendResults });
    }

    return new Response(JSON.stringify({ processed: blasts.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (e) {
    console.error('send-event-blasts error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function mdToHtml(md: string) {
  // Minimal conversion: escape HTML then convert newlines to <br/>
  return (md || '').split('\n').map(l => escapeHtml(l)).join('<br/>');
}
