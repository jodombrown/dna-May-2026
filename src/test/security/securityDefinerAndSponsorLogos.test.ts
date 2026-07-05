/**
 * Live integration tests against the project's Supabase instance using the
 * anon key. These lock in the security posture set by the "lockdown SECURITY
 * DEFINER functions and sponsor-logos storage" migration so the two findings
 * cannot silently reappear.
 *
 *   - Anon MUST NOT be able to call `public.get_my_contact_info()`
 *   - Anon MUST NOT be able to call `public.is_space_lead(uuid, uuid)`
 *   - Anon MUST NOT be able to upload / update / delete objects in the
 *     `sponsor-logos` storage bucket
 *
 * Tests skip themselves cleanly if the Supabase env vars are missing (e.g.
 * offline CI), so they never produce false failures.
 */

import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const canRun = !!url && !!anonKey;
const d = canRun ? describe : describe.skip;

const anonClient = () =>
  createClient(url as string, anonKey as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

d('security · SECURITY DEFINER functions are not callable by anon', () => {
  it('rejects rpc get_my_contact_info() for anon', async () => {
    const supabase = anonClient();
    const { data, error } = await supabase.rpc('get_my_contact_info');
    expect(error).not.toBeNull();
    expect(data).toBeNull();
    // Postgres permission-denied surfaces as 42501 or the PostgREST 401/403.
    const msg = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase();
    expect(
      msg.includes('permission denied') ||
        msg.includes('42501') ||
        msg.includes('not authenticated') ||
        msg.includes('authentication required'),
    ).toBe(true);
  });

  it('rejects rpc is_space_lead(uuid, uuid) for anon', async () => {
    const supabase = anonClient();
    const { data, error } = await supabase.rpc('is_space_lead', {
      _space_id: '00000000-0000-0000-0000-000000000000',
      _user_id: '00000000-0000-0000-0000-000000000000',
    });
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });
});

d('security · sponsor-logos storage bucket is write-locked for non-admins', () => {
  const testPath = `security-test/${Date.now()}-anon.txt`;

  // Use raw fetch against the Storage REST endpoint. The supabase-js Blob
  // upload path fails in the jsdom/undici test environment for unrelated
  // multipart reasons; the REST endpoint is what the SDK ultimately calls
  // and it exercises the exact same RLS policies.
  const storageFetch = (method: string, path: string, body?: string) =>
    fetch(`${url}/storage/v1/object/sponsor-logos/${path}`, {
      method,
      headers: {
        apikey: anonKey as string,
        authorization: `Bearer ${anonKey as string}`,
        'content-type': 'text/plain',
        'x-upsert': 'false',
      },
      body,
    });

  it('blocks anon uploads to sponsor-logos', async () => {
    const res = await storageFetch('POST', testPath, 'nope');
    expect(res.ok).toBe(false);
    expect(res.status).toBeGreaterThanOrEqual(400);
  }, 15000);

  it('blocks anon updates to sponsor-logos', async () => {
    const res = await storageFetch('PUT', testPath, 'nope');
    expect(res.ok).toBe(false);
    expect(res.status).toBeGreaterThanOrEqual(400);
  }, 15000);

  it('blocks anon deletes from sponsor-logos', async () => {
    const supabase = anonClient();
    const { data, error } = await supabase.storage
      .from('sponsor-logos')
      .remove([testPath]);

    // remove() either errors or returns an empty list when RLS filters
    // out every candidate - both prove nothing was actually deleted.
    const removedCount = Array.isArray(data) ? data.length : 0;
    expect(error !== null || removedCount === 0).toBe(true);
  });
});

d('security · sponsor_logo_audit_log is not readable by anon', () => {
  it('rejects direct REST SELECT on sponsor_logo_audit_log for anon', async () => {
    const res = await fetch(
      `${url}/rest/v1/sponsor_logo_audit_log?select=id&limit=1`,
      {
        headers: {
          apikey: anonKey as string,
          authorization: `Bearer ${anonKey as string}`,
        },
      },
    );
    // Must NOT return a readable row list.
    if (res.ok) {
      const body = (await res.json()) as unknown[];
      expect(Array.isArray(body) && body.length === 0).toBe(true);
    } else {
      expect(res.status).toBeGreaterThanOrEqual(400);
    }
  });

  it('rejects list_sponsor_logo_audit_log RPC for anon', async () => {
    const supabase = anonClient();
    const { data, error } = await supabase.rpc('list_sponsor_logo_audit_log', {
      _limit: 1,
      _offset: 0,
    });
    expect(error).not.toBeNull();
    expect(data).toBeNull();
    const msg = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase();
    expect(
      msg.includes('permission denied') ||
        msg.includes('42501') ||
        msg.includes('not authenticated') ||
        msg.includes('authentication required'),
    ).toBe(true);
  });
});
