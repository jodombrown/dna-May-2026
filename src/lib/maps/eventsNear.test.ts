/**
 * Unit tests for getEventsNear (BD212 fallback chain + BD213 error surfacing).
 *
 * BD213 is the invariant these tests exist to protect: the try/catch guards
 * ONLY the geolocation prompt. An RPC failure from queryNear() must propagate
 * to the caller, never be swallowed and mis-reported as a fall-through to the
 * declared/chapter anchors (which would silently render as "no results").
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const rpc = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...args: unknown[]) => rpc(...args) },
}));

import { getEventsNear } from './eventsNear';

// Fake geolocation whose behaviour each test sets. Returns success or error
// through the standard getCurrentPosition(success, error, options) contract.
let geolocation: {
  getCurrentPosition: (
    success: (pos: GeolocationPosition) => void,
    error: (err: unknown) => void,
  ) => void;
} | undefined;

function deviceAt(lat: number, lng: number) {
  geolocation = {
    getCurrentPosition: (success) =>
      success({ coords: { latitude: lat, longitude: lng } } as GeolocationPosition),
  };
}

function deviceDenied() {
  geolocation = {
    getCurrentPosition: (_success, error) => error(new Error('denied')),
  };
}

beforeEach(() => {
  rpc.mockReset();
  // rpc_events_near default: one hit, no error.
  rpc.mockResolvedValue({
    data: [{ event_id: 'e1', distance_m: 1200 }],
    error: null,
  });
  geolocation = undefined;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    get: () => ({ geolocation }),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getEventsNear fallback chain (BD212)', () => {
  it('uses device coordinates when geolocation resolves', async () => {
    deviceAt(40.1, -74.2);
    const res = await getEventsNear({});
    expect(res.anchor).toBe('device');
    expect(res.order).toEqual([{ eventId: 'e1', distanceM: 1200 }]);
    expect(rpc).toHaveBeenCalledWith(
      'rpc_events_near',
      expect.objectContaining({ p_lat: 40.1, p_lng: -74.2 }),
    );
  });

  it('falls through to declared when geolocation is denied', async () => {
    deviceDenied();
    const res = await getEventsNear({ declared: { lat: 5.6, lng: -0.2 } });
    expect(res.anchor).toBe('declared');
    expect(rpc).toHaveBeenCalledWith(
      'rpc_events_near',
      expect.objectContaining({ p_lat: 5.6, p_lng: -0.2 }),
    );
  });

  it('falls through to chapter when denied and no declared anchor exists', async () => {
    deviceDenied();
    const res = await getEventsNear({ chapter: { lat: 6.5, lng: 3.4 } });
    expect(res.anchor).toBe('chapter');
    expect(rpc).toHaveBeenCalledWith(
      'rpc_events_near',
      expect.objectContaining({ p_lat: 6.5, p_lng: 3.4 }),
    );
  });

  it('returns anchor "none" with no order when no anchor is available', async () => {
    deviceDenied();
    const res = await getEventsNear({});
    expect(res).toEqual({ order: [], anchor: 'none' });
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe('getEventsNear RPC error surfacing (BD213)', () => {
  it('propagates an RPC error on the device branch instead of falling through', async () => {
    deviceAt(40.1, -74.2);
    rpc.mockResolvedValue({ data: null, error: new Error('rpc boom') });

    // Must reject — NOT silently fall through to the declared anchor.
    await expect(
      getEventsNear({ declared: { lat: 5.6, lng: -0.2 } }),
    ).rejects.toThrow('rpc boom');

    // And it must not have retried against the declared coordinate.
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('propagates an RPC error on a fallback branch too', async () => {
    deviceDenied();
    rpc.mockResolvedValue({ data: null, error: new Error('rpc boom') });
    await expect(
      getEventsNear({ declared: { lat: 5.6, lng: -0.2 } }),
    ).rejects.toThrow('rpc boom');
  });
});
