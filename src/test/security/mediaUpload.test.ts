/**
 * Live media-upload security tests against the project's Supabase instance.
 *
 * This is the positive-path coverage the media cycle never had: it proves a
 * real, signed-in member can put each media class into `dna-media-public`, and
 * that the row that lands is keyed to THAT member — not that some service-role
 * bypass could. service_role and postgres certify NOTHING about a policy, so
 * every accept/reject assertion below runs as an authenticated user holding a
 * real session, exactly the path a member's browser takes. The service client
 * is used only to (a) mint and delete the throwaway user and (b) read the
 * resulting rows back out of `storage.objects` / `storage.buckets`.
 *
 * FAIL-CLOSED (BD238): missing credentials are a hard failure, never a skip. A
 * green run that asserted nothing is worse than no gate (BD121, BD141).
 * Excluded from the hermetic `npm test` run; executed by
 * .github/workflows/security-tests.yml ("Run security integration tests").
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  uploadMedia,
  IMAGE_TYPES,
  VIDEO_TYPES,
  DOC_TYPES,
  type Surface,
} from '@/lib/uploadMedia';
// The singleton the app (and uploadMedia) actually uses. Tests 1–4, 8 and 10 all
// drive the real uploadMedia() through this client, so it must carry the member's
// session too.
import { supabase as appClient } from '@/integrations/supabase/client';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PUBLIC_BUCKET = 'dna-media-public';
const PRIVATE_BUCKET = 'dna-media-private';
const BUCKET_SIZE_LIMIT = 524288000; // 500 MiB, mirrored on both buckets

// A domain that can never collide with a real member. .invalid is reserved by
// RFC 2606 and will never resolve.
const CITEST_DOMAIN = 'dna-citest.invalid';

// --- shared state, populated in beforeAll -----------------------------------
let service: SupabaseClient; // service-role: admin + reading storage rows back
let userClient: SupabaseClient; // anon-key client WITH a real member session
let anonClient: SupabaseClient; // anon-key client with NO session
let testUid = ''; // the throwaway member's auth uid
let testEmail = '';
let testPassword = '';

// Every object we successfully create, so teardown can remove exactly those.
const createdPaths: string[] = [];

// A few-byte body per class. Storage validates the *declared* content-type
// against the bucket allow-list, not the bytes, so tiny payloads are enough.
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]);
const TINY = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);

let pathSeq = 0;
const uniquePath = (uid: string, ext: string) =>
  `${uid}/security-test/${Date.now()}-${pathSeq++}-${crypto.randomUUID()}.${ext}`;

describe('security · media-upload harness preflight', () => {
  it('has live Supabase credentials — fail-closed, never skipped', () => {
    const missing = [
      !url && 'VITE_SUPABASE_URL',
      !anonKey && 'VITE_SUPABASE_PUBLISHABLE_KEY',
      !serviceKey && 'SUPABASE_SERVICE_ROLE_KEY',
    ].filter(Boolean);
    if (missing.length > 0) {
      throw new Error(
        `Media-upload security suite cannot certify anything: missing ${missing.join(', ')}. ` +
          'This is a hard failure by design (BD238). Populate the repository ' +
          'secret(s); do not reintroduce describe.skip.',
      );
    }
    expect(missing).toHaveLength(0);
  });
});

beforeAll(async () => {
  if (!url || !anonKey || !serviceKey) {
    throw new Error(
      'Media-upload security suite: missing live credentials, refusing to run ' +
        '(BD238). See the preflight failure above.',
    );
  }

  service = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Mint a throwaway, email-confirmed member under an unrouteable domain.
  testEmail = `mediaupload-${Date.now()}-${crypto.randomUUID()}@${CITEST_DOMAIN}`;
  testPassword = `Pw-${crypto.randomUUID()}`;
  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  });
  if (createErr || !created?.user?.id) {
    throw new Error(`Could not create throwaway test user: ${createErr?.message ?? 'no user returned'}`);
  }
  testUid = created.user.id;

  // Sign that user in on an anon-key client. THIS is the point of the suite:
  // uploads must go through a member session, not the service role.
  userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: signIn, error: signInErr } = await userClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  if (signInErr || !signIn?.session) {
    throw new Error(`Could not sign the test user in: ${signInErr?.message ?? 'no session'}`);
  }

  // A second anon-key client with NO session, for the anonymous negative test.
  anonClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // uploadMedia() reaches for the app's singleton client. Give it the same
  // member session so the tests that drive the real spine — 1–4 landing each
  // media class, 8 hitting the size gate — exercise the product path rather than
  // tripping the "session expired" guard first.
  const { error: appSignInErr } = await appClient.auth.setSession({
    access_token: signIn.session.access_token,
    refresh_token: signIn.session.refresh_token,
  });
  if (appSignInErr) {
    throw new Error(`Could not seat the member session on the app client: ${appSignInErr.message}`);
  }
}, 60000);

afterAll(async () => {
  // Teardown MUST run even when assertions fail — a test that leaves rows in
  // production is its own defect. Delete objects first, then the user, and do
  // not let a failure in one step skip the next.
  try {
    if (service && createdPaths.length > 0) {
      await service.storage.from(PUBLIC_BUCKET).remove(createdPaths);
    }
  } catch {
    /* fall through to user deletion regardless */
  }
  try {
    if (service && testUid) {
      await service.auth.admin.deleteUser(testUid);
    }
  } finally {
    await Promise.allSettled([
      userClient?.auth.signOut(),
      appClient?.auth.signOut(),
    ]);
  }
}, 60000);

/**
 * Drive a real File of the given class through uploadMedia() — the spine the
 * product ships — as the signed-in member, then read the landed row back through
 * the service client and prove it is keyed to this member. Upload success alone
 * is not the assertion — the row is.
 *
 * This calls uploadMedia() rather than reconstructing the storage call, on
 * purpose. A hand-rolled userClient.upload(..., { upsert: false }) is a DIFFERENT
 * SQL statement with a DIFFERENT permission set than the spine's upsert: true
 * read-modify-write, which is how a broken product once passed this gate. The
 * only faithful exercise of the spine is the spine.
 */
async function uploadAndVerify(
  contentType: string,
  ext: string,
  body: Uint8Array,
  surface: Surface = 'post',
) {
  // A real File, exactly what a picker hands the spine. uploadMedia() derives the
  // media class from file.type and builds the uid/surface-scoped path itself — the
  // test never names the path, so it cannot drift from what the product writes.
  const file = new File([body], `security-test.${ext}`, { type: contentType });
  const publicUrl = await uploadMedia(file, surface);

  // The spine's return value: a public URL keyed to THIS member and the surface it
  // was told to file under.
  expect(typeof publicUrl).toBe('string');
  expect(publicUrl).toContain(testUid);
  expect(publicUrl).toContain(`/${surface}/`);

  // Recover the storage key (uid/surface/ts-name) the spine chose from the URL, so
  // the read-back below probes the exact object that landed.
  const marker = `/${PUBLIC_BUCKET}/`;
  const at = publicUrl.indexOf(marker);
  expect(at).toBeGreaterThan(-1);
  const path = decodeURIComponent(publicUrl.slice(at + marker.length));
  createdPaths.push(path);

  // Read the persisted row back. PostgREST here exposes only public +
  // graphql_public, so storage.objects is read through the service_role-only
  // security_probe_media_object() function. storage.objects.owner_id is the
  // uploader's auth.uid() as text; the first path segment is RLS's folder key.
  const { data: rows, error: readErr } = await service.rpc('security_probe_media_object', {
    p_bucket: PUBLIC_BUCKET,
    p_name: path,
  });

  expect(readErr).toBeNull();
  expect(Array.isArray(rows)).toBe(true);
  expect(rows).toHaveLength(1);
  const row = (rows as Array<{ bucket_id: string; owner_id: string | null; name: string }>)[0];
  expect(row.bucket_id).toBe(PUBLIC_BUCKET);
  expect(row.owner_id).toBe(testUid);
  // split_part(name, '/', 1) — the folder key RLS enforces — is this member.
  expect(row.name.split('/')[0]).toBe(testUid);
}

describe('security · a signed-in member can upload every media class', () => {
  it('1. image (image/png) lands and is owned by the member', async () => {
    expect(IMAGE_TYPES).toContain('image/png');
    await uploadAndVerify('image/png', 'png', PNG_BYTES);
  }, 30000);

  it('2. image/heic lands and is owned by the member', async () => {
    // The type rejected at four layers, the reason this cycle exists. It must
    // be a member of the image class in code AND accepted by the live bucket.
    expect(IMAGE_TYPES).toContain('image/heic');
    await uploadAndVerify('image/heic', 'heic', TINY);
  }, 30000);

  it('3. video (video/mp4) lands and is owned by the member', async () => {
    expect(VIDEO_TYPES).toContain('video/mp4');
    await uploadAndVerify('video/mp4', 'mp4', TINY);
  }, 30000);

  it('4. document (application/pdf) lands and is owned by the member', async () => {
    expect(DOC_TYPES).toContain('application/pdf');
    await uploadAndVerify('application/pdf', 'pdf', TINY);
  }, 30000);
});

describe('security · uploads that must be refused', () => {
  it('5. anon (no session) cannot upload to dna-media-public', async () => {
    const path = uniquePath(testUid, 'png');
    // upsert: true — the same statement shape the spine issues. These three tests
    // stay direct client calls (the spine refuses to CONSTRUCT a cross-tenant or
    // unapproved-type request at all), but they must fail against the exact SQL the
    // product runs, not a plainer INSERT with a looser permission set.
    const { data, error } = await anonClient.storage
      .from(PUBLIC_BUCKET)
      .upload(path, PNG_BYTES, { contentType: 'image/png', upsert: true });
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  }, 30000);

  it('6. a member cannot write under ANOTHER uid\'s folder', async () => {
    const otherUid = crypto.randomUUID();
    expect(otherUid).not.toBe(testUid);
    const path = `${otherUid}/security-test/${Date.now()}-cross-tenant.png`;
    const { data, error } = await userClient.storage
      .from(PUBLIC_BUCKET)
      .upload(path, PNG_BYTES, { contentType: 'image/png', upsert: true });
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  }, 30000);

  it('7. an unapproved content-type is refused', async () => {
    const badType = 'application/x-msdownload';
    expect([...IMAGE_TYPES, ...VIDEO_TYPES, ...DOC_TYPES]).not.toContain(badType);
    const path = uniquePath(testUid, 'exe');
    const { data, error } = await userClient.storage
      .from(PUBLIC_BUCKET)
      .upload(path, TINY, { contentType: badType, upsert: true });
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  }, 30000);

  it('8. uploadMedia() throws the size-cap message, with the real numbers', async () => {
    // image cap is 25 MB; hand it 30 MB of image/png. This test is named for the
    // SIZE gate, so its fixture must be a plain image whose membership never
    // moves — not image/heic, which coupled this assertion to an unrelated
    // matrix change. The synthetic bytes are not a decodable image, so the
    // canvas compression path throws and falls back to the original file: the
    // size the gate sees is the size we built.
    const oversize = 30 * 1024 * 1024;
    const bigImage = new File([new Uint8Array(oversize)], 'too-big.png', { type: 'image/png' });

    let capErr: unknown;
    try {
      await uploadMedia(bigImage, 'post');
    } catch (e) {
      capErr = e;
    }
    expect(capErr).toBeInstanceOf(Error);
    const msg = String((capErr as Error)?.message ?? '');
    // Real numbers, not a generic string: the actual size and the actual cap.
    expect(msg).toContain('30 MB');
    expect(msg).toContain('Image files go up to 25 MB here.');
  }, 30000);
});

describe('security · storage buckets have not drifted from the code matrix', () => {
  it('9. allowed_mime_types equals the code union; limits and visibility match', async () => {
    const expected = new Set<string>([...IMAGE_TYPES, ...VIDEO_TYPES, ...DOC_TYPES]);

    for (const bucketId of [PUBLIC_BUCKET, PRIVATE_BUCKET]) {
      // Read the bucket through the Storage Admin API (the storage schema is
      // not exposed to PostgREST here). getBucket returns the same
      // storage.buckets row: allowed_mime_types, file_size_limit, public.
      const { data: bucket, error } = await service.storage.getBucket(bucketId);

      expect(error).toBeNull();
      expect(bucket).not.toBeNull();
      const actual = new Set<string>(bucket?.allowed_mime_types ?? []);

      // Set comparison in BOTH directions: neither subset nor superset. A type
      // added to the bucket by hand, or dropped from the code, fails here.
      const missingFromBucket = [...expected].filter((t) => !actual.has(t));
      const extraInBucket = [...actual].filter((t) => !expected.has(t));
      expect(missingFromBucket).toEqual([]);
      expect(extraInBucket).toEqual([]);
      expect(actual.size).toBe(expected.size);

      expect(bucket?.file_size_limit).toBe(BUCKET_SIZE_LIMIT);
      expect(bucket?.public).toBe(bucketId === PUBLIC_BUCKET);
    }
  }, 30000);
});

describe('security · an expired session is refused before it reaches storage', () => {
  it('10. uploadMedia() rejects an expired session with the session message, not RLS', async () => {
    // Every other test signs in seconds earlier, so its token is always fresh —
    // which is exactly why the suite went green while the product was broken: the
    // real failure is an EXPIRED token that getSession() still returns. Hand
    // uploadMedia() one whose access token is past expiry and syntactically valid
    // but unverifiable, and whose refresh the server rejects, and prove the member
    // gets the session message rather than a raw RLS 42501 — and that nothing lands.
    const nowSec = Math.floor(Date.now() / 1000);
    const b64url = (o: object) =>
      btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    // header.payload.signature — well-formed three-part JWT, exp an hour in the
    // past, signature is junk so it can never be verified.
    const deadJwt =
      `${b64url({ alg: 'HS256', typ: 'JWT' })}.` +
      `${b64url({ sub: testUid, role: 'authenticated', exp: nowSec - 3600 })}.` +
      'c2lnbmF0dXJl';

    const expiredSession = {
      access_token: deadJwt,
      refresh_token: 'invalid-refresh-token',
      token_type: 'bearer',
      expires_in: 0,
      expires_at: nowSec - 3600,
      user: { id: testUid },
    };

    // getSession() hands the code the expired session; the unverifiable token
    // cannot be refreshed, so the server rejects it — model that as a failed
    // refreshSession(). Both are on the singleton uploadMedia() itself calls.
    const getSpy = vi
      .spyOn(appClient.auth, 'getSession')
      .mockResolvedValue({ data: { session: expiredSession }, error: null } as never);
    const refreshSpy = vi
      .spyOn(appClient.auth, 'refreshSession')
      .mockResolvedValue({
        data: { session: null, user: null },
        error: { name: 'AuthApiError', message: 'Invalid Refresh Token' },
      } as never);

    // Freeze the clock: the expiry check reads it, and the path uploadMedia WOULD
    // build embeds it — so the exact object we probe for is deterministic.
    const FIXED = (nowSec + 5) * 1000;
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(FIXED);
    const wouldBePath = `${testUid}/post/${FIXED}-expired-session-probe.png`;

    try {
      let err: unknown;
      try {
        const file = new File([PNG_BYTES], 'expired-session-probe.png', { type: 'image/png' });
        await uploadMedia(file, 'post');
      } catch (e) {
        err = e;
      }

      expect(err).toBeInstanceOf(Error);
      expect(String((err as Error).message)).toBe(
        'Your session has expired. Sign back in and this will upload.',
      );

      // Not a raw RLS rejection leaking through, and no object at the path it
      // would have used — the request was refused before it ever hit storage.
      const { data: rows, error: readErr } = await service.rpc('security_probe_media_object', {
        p_bucket: PUBLIC_BUCKET,
        p_name: wouldBePath,
      });
      expect(readErr).toBeNull();
      expect(rows).toEqual([]);
    } finally {
      dateSpy.mockRestore();
      getSpy.mockRestore();
      refreshSpy.mockRestore();
    }
  }, 30000);
});

// ---------------------------------------------------------------------------
// OWED — test 11: the same four media classes through the PRIVATE bucket path
// (dna-media-private), landing under the member's folder and readable back only
// by that member (dna_media_private_select_own).
//
// It is NOT written yet, and it is NOT a describe.skip / it.skip, on purpose.
// uploadMedia() hard-codes bucket = 'dna-media-public' for all four surfaces in
// this pass (uploadMedia.ts §g); nothing routes to dna-media-private until
// messages and Spaces move onto the spine. A skipped test reads, in the suite
// summary, as coverage that exists and happens to be paused — under the
// fail-closed preflight (BD238) that is exactly the "green that asserted nothing"
// this file exists to prevent. So the coverage is recorded here as an explicit
// debt, visible in the source and owed against the private-bucket cutover, and it
// will be added — through the spine, never reconstructed — when that surface
// lands. Do not discharge this by adding a placeholder that skips.
// ---------------------------------------------------------------------------
