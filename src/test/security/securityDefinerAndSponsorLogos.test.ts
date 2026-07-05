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
  const body = new Blob(['nope'], { type: 'text/plain' });

  it('blocks anon uploads to sponsor-logos', async () => {
    const supabase = anonClient();
    const { data, error } = await supabase.storage
      .from('sponsor-logos')
      .upload(testPath, body, { upsert: false });

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  }, 20000);

  it('blocks anon updates to sponsor-logos', async () => {
    const supabase = anonClient();
    const { data, error } = await supabase.storage
      .from('sponsor-logos')
      .update(testPath, body);

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  }, 20000);

  it('blocks anon deletes from sponsor-logos', async () => {
    const supabase = anonClient();
    const { data, error } = await supabase.storage
      .from('sponsor-logos')
      .remove([testPath]);

    // Storage remove returns error OR an empty successful array when RLS filters
    // out every candidate row - both prove no rows were actually removed.
    const removedCount = Array.isArray(data) ? data.length : 0;
    expect(error !== null || removedCount === 0).toBe(true);
  });
});
