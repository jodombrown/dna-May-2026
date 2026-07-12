/**
 * THE LIVE BUG: start_time used to be built from the ORGANIZER'S BROWSER
 * clock while `timezone` defaulted to 'UTC' — an Accra event created from
 * Los Angeles was stored seven hours wrong.
 *
 * These tests pin the fix: the conversion functions take the EVENT'S zone
 * explicitly and never read the process/browser timezone, so an organizer in
 * Los Angeles creating a 7:00 PM Accra event stores the 7:00 PM-in-Accra
 * instant — not 7:00 PM Pacific, and not off by hours in either direction.
 */
import { describe, it, expect } from 'vitest';
import {
  wallTimeToUtc,
  utcToWallTime,
  formatTimeInZone,
  timezoneForLocation,
  zoneCityLabel,
} from '@/lib/events/timezone';

describe('the LA organizer / Accra event case', () => {
  it('stores 7:00 PM in Accra as the Accra instant, wherever the organizer is', () => {
    // Accra is UTC+0 year-round: 19:00 wall clock === 19:00Z. If the browser
    // zone leaked in (the old bug), an LA organizer would store 02:00Z.
    const stored = wallTimeToUtc('2026-08-15', '19:00', 'Africa/Accra');
    expect(stored.toISOString()).toBe('2026-08-15T19:00:00.000Z');
  });

  it('is NOT what the organizer’s LA wall clock would have produced', () => {
    const wrongOldBehaviour = wallTimeToUtc('2026-08-15', '19:00', 'America/Los_Angeles');
    expect(wrongOldBehaviour.toISOString()).toBe('2026-08-16T02:00:00.000Z'); // 7 hours later
    expect(wrongOldBehaviour.toISOString()).not.toBe(
      wallTimeToUtc('2026-08-15', '19:00', 'Africa/Accra').toISOString()
    );
  });

  it('shows the LA viewer their local equivalent: doors 7:00 PM Accra = 12:00 PM in LA', () => {
    const stored = wallTimeToUtc('2026-08-15', '19:00', 'Africa/Accra').toISOString();
    expect(formatTimeInZone(stored, 'Africa/Accra')).toBe('7:00 PM');
    expect(formatTimeInZone(stored, 'America/Los_Angeles')).toBe('12:00 PM'); // PDT, UTC-7
  });

  it('derives Africa/Accra from the event’s location, not from any browser', () => {
    expect(timezoneForLocation({ countryCode: 'GH' })).toBe('Africa/Accra');
    expect(timezoneForLocation({ country: 'Ghana' })).toBe('Africa/Accra');
    expect(zoneCityLabel('Africa/Accra')).toBe('Accra');
  });
});

describe('wallTimeToUtc across DST and offsets', () => {
  it('handles DST-observing zones (London summer = UTC+1)', () => {
    expect(wallTimeToUtc('2026-07-10', '19:00', 'Europe/London').toISOString()).toBe(
      '2026-07-10T18:00:00.000Z'
    );
    expect(wallTimeToUtc('2026-01-10', '19:00', 'Europe/London').toISOString()).toBe(
      '2026-01-10T19:00:00.000Z'
    );
  });

  it('handles Lagos (UTC+1, no DST)', () => {
    expect(wallTimeToUtc('2026-08-15', '18:30', 'Africa/Lagos').toISOString()).toBe(
      '2026-08-15T17:30:00.000Z'
    );
  });

  it('round-trips: stored UTC reads back as the event-local wall clock', () => {
    const stored = wallTimeToUtc('2026-08-15', '19:00', 'Africa/Nairobi');
    expect(utcToWallTime(stored.toISOString(), 'Africa/Nairobi')).toEqual({
      date: '2026-08-15',
      time: '19:00',
    });
  });
});

describe('timezoneForLocation', () => {
  it('resolves single-zone countries by code and by name', () => {
    expect(timezoneForLocation({ countryCode: 'NG' })).toBe('Africa/Lagos');
    expect(timezoneForLocation({ country: 'Kenya' })).toBe('Africa/Nairobi');
    expect(timezoneForLocation({ country: 'Jamaica' })).toBe('America/Jamaica');
  });

  it('picks the nearest zone inside multi-zone countries by coordinates', () => {
    expect(timezoneForLocation({ countryCode: 'US', lat: 40.7, lng: -74.0 })).toBe(
      'America/New_York'
    );
    expect(timezoneForLocation({ countryCode: 'US', lat: 34.05, lng: -118.24 })).toBe(
      'America/Los_Angeles'
    );
    expect(timezoneForLocation({ countryCode: 'CD', lat: -4.3, lng: 15.3 })).toBe(
      'Africa/Kinshasa'
    );
    expect(timezoneForLocation({ countryCode: 'CD', lat: -11.7, lng: 27.5 })).toBe(
      'Africa/Lubumbashi'
    );
  });

  it('falls back to the most-populous zone without coordinates', () => {
    expect(timezoneForLocation({ countryCode: 'US' })).toBe('America/New_York');
  });

  it('returns null for an unrecognizable place — callers must fall back loudly', () => {
    expect(timezoneForLocation({ country: 'Atlantis' })).toBeNull();
    expect(timezoneForLocation({})).toBeNull();
  });
});
