import { describe, it, expect } from 'vitest';
import { formatEventPlace, pickEventPlace } from './formatPlace';

const place = (
  city: string | null,
  state: string | null,
  country: string | null,
  extra: Record<string, unknown> = {}
) => ({
  location_city: city,
  location_state: state,
  location_country: country,
  ...extra,
});

describe('formatEventPlace compact — the dedupe rule', () => {
  it('city + distinct state renders "city, state"', () => {
    expect(formatEventPlace(place('Los Angeles', 'California', 'United States'), 'compact')).toBe(
      'Los Angeles, California'
    );
  });

  it('state equal to city dedupes away and the country steps in — "Lagos, Lagos" is not a place', () => {
    expect(formatEventPlace(place('Lagos', 'Lagos', 'Nigeria'), 'compact')).toBe('Lagos, Nigeria');
  });

  it('state equal to city dedupes case-insensitively', () => {
    expect(formatEventPlace(place('Lagos', 'LAGOS', 'Nigeria'), 'compact')).toBe('Lagos, Nigeria');
  });

  it('no state falls back to "city, country"', () => {
    expect(formatEventPlace(place('Accra', null, 'Ghana'), 'compact')).toBe('Accra, Ghana');
  });

  it('country only renders the country alone', () => {
    expect(formatEventPlace(place(null, null, 'Ghana'), 'compact')).toBe('Ghana');
  });

  it('all null renders "" — never "undefined"', () => {
    expect(formatEventPlace(place(null, null, null), 'compact')).toBe('');
  });

  it('empty and whitespace strings count as absent', () => {
    expect(formatEventPlace(place('', '  ', ''), 'compact')).toBe('');
  });
});

describe('formatEventPlace compact — virtual and hybrid', () => {
  it('virtual renders "Virtual"', () => {
    expect(
      formatEventPlace(place('Accra', null, 'Ghana', { format: 'virtual' }), 'compact')
    ).toBe('Virtual');
  });

  it('virtual with a platform appends it', () => {
    expect(
      formatEventPlace(place(null, null, null, { format: 'virtual', meeting_platform: 'Zoom' }), 'compact')
    ).toBe('Virtual · Zoom');
  });

  it('legacy is_virtual flag counts as virtual', () => {
    expect(
      formatEventPlace(place('Accra', null, 'Ghana', { is_virtual: true }), 'compact')
    ).toBe('Virtual');
  });

  it('hybrid with a city renders "Hybrid · city"', () => {
    expect(
      formatEventPlace(place('Nairobi', null, 'Kenya', { format: 'hybrid' }), 'compact')
    ).toBe('Hybrid · Nairobi');
  });

  it('hybrid without a city renders "Hybrid"', () => {
    expect(formatEventPlace(place(null, null, 'Kenya', { format: 'hybrid' }), 'compact')).toBe(
      'Hybrid'
    );
  });
});

describe('formatEventPlace full — the detail block', () => {
  it('renders venue, street, and a deduped locality with the country', () => {
    expect(
      formatEventPlace(
        place('Los Angeles', 'California', 'United States', {
          location_name: 'The Grove',
          location_address: '189 The Grove Dr',
        }),
        'full'
      )
    ).toEqual({
      venue: 'The Grove',
      street: '189 The Grove Dr',
      locality: 'Los Angeles, California, United States',
    });
  });

  it('applies the dedupe rule to the locality', () => {
    expect(formatEventPlace(place('Lagos', 'Lagos', 'Nigeria'), 'full')).toEqual({
      locality: 'Lagos, Nigeria',
    });
  });

  it('omits absent parts entirely', () => {
    expect(formatEventPlace(place(null, null, 'Ghana'), 'full')).toEqual({ locality: 'Ghana' });
    expect(formatEventPlace(place(null, null, null), 'full')).toEqual({});
  });
});

describe('pickEventPlace', () => {
  it('extracts trimmed place fields from a loose row and nulls the rest', () => {
    const row: Record<string, unknown> = {
      location_name: '  The Grove ',
      location_city: 'Los Angeles',
      location_state: '',
      location_country: undefined,
      unrelated: 42,
    };
    expect(pickEventPlace(row)).toEqual({
      location_name: 'The Grove',
      location_address: null,
      location_city: 'Los Angeles',
      location_state: null,
      location_country: null,
    });
  });
});
