/**
 * THE RULE: time_confirmed === false means the source published a date but
 * no hour — the stored 09:00 is a fabrication and must never surface. These
 * tests pin every variant: unconfirmed rows render dates (or date ranges)
 * only, with nothing where the clock would be.
 */
import { describe, it, expect } from 'vitest';
import { formatEventDateTime } from '@/lib/events/eventTime';

const CONFIRMED = {
  start_time: '2026-11-01T19:00:00Z',
  end_time: '2026-11-01T21:00:00Z',
  time_confirmed: true,
} as const;

const UNCONFIRMED = { ...CONFIRMED, time_confirmed: false } as const;

const MULTI_DAY_UNCONFIRMED = {
  start_time: '2026-11-01T09:00:00Z',
  end_time: '2026-11-05T18:00:00Z',
  time_confirmed: false,
} as const;

describe('clock variant', () => {
  it('renders the range with a trusted hour', () => {
    expect(formatEventDateTime(CONFIRMED, 'clock')).toMatch(/\d{1,2}:\d{2} [AP]M – \d{1,2}:\d{2} [AP]M/);
  });

  it('renders NOTHING when the hour is unverified', () => {
    expect(formatEventDateTime(UNCONFIRMED, 'clock')).toBe('');
  });

  it('appends the zone label when provided', () => {
    expect(
      formatEventDateTime({ ...CONFIRMED, timezone: 'Africa/Lagos' }, 'clock')
    ).toContain('(Africa/Lagos)');
  });
});

describe('date variant', () => {
  it('is identical for confirmed and unconfirmed rows — dates are real either way', () => {
    expect(formatEventDateTime(UNCONFIRMED, 'date')).toBe(formatEventDateTime(CONFIRMED, 'date'));
    expect(formatEventDateTime(UNCONFIRMED, 'date')).not.toContain(':');
  });

  it('renders a multi-day event as a date range', () => {
    expect(formatEventDateTime(MULTI_DAY_UNCONFIRMED, 'date')).toBe('November 1–5, 2026');
  });
});

describe('datetime and compact variants', () => {
  it('carries the clock only when confirmed', () => {
    expect(formatEventDateTime(CONFIRMED, 'datetime')).toMatch(/· \d{1,2}:\d{2} [AP]M$/);
    expect(formatEventDateTime(UNCONFIRMED, 'datetime')).not.toMatch(/\d:\d\d/);
  });

  it('never shows a clock on an unconfirmed compact line', () => {
    expect(formatEventDateTime(UNCONFIRMED, 'compact')).not.toMatch(/\d:\d\d/);
  });

  it('renders a multi-day range without inventing an hour', () => {
    expect(formatEventDateTime(MULTI_DAY_UNCONFIRMED, 'compact')).toBe('Nov 1–Nov 5');
  });
});

describe('degenerate inputs', () => {
  it('renders nothing for a missing start_time — never a placeholder', () => {
    expect(formatEventDateTime({ start_time: null, time_confirmed: false }, 'compact')).toBe('');
    expect(formatEventDateTime({ start_time: 'garbage', time_confirmed: true }, 'date')).toBe('');
  });
});
