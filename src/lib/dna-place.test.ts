import { describe, it, expect } from 'vitest';
import {
  CONTINENTS,
  CONTINENT_COUNTRY_LIST,
  getCountriesForContinent,
  isValidAlpha3,
  type ContinentCode,
} from './dna-place';

const ALL_CONTINENTS: ContinentCode[] = ['AF', 'AS', 'EU', 'NA', 'SA', 'OC'];

describe('getCountriesForContinent', () => {
  it.each(ALL_CONTINENTS)(
    'returns a non-empty country list for %s',
    (code) => {
      const list = getCountriesForContinent(code);
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
    }
  );

  it('returns [] when no continent is selected', () => {
    expect(getCountriesForContinent('')).toEqual([]);
  });

  it('every country option exposes a valid ISO 3166-1 alpha-3 code', () => {
    for (const code of ALL_CONTINENTS) {
      for (const country of CONTINENT_COUNTRY_LIST[code]) {
        expect(country.alpha3).toMatch(/^[A-Z]{3}$/);
        expect(country.name.length).toBeGreaterThan(0);
      }
    }
  });

  it('CONTINENTS list matches the keys of CONTINENT_COUNTRY_LIST', () => {
    const fromOptions = CONTINENTS.map((c) => c.code).sort();
    const fromTable = Object.keys(CONTINENT_COUNTRY_LIST).sort();
    expect(fromOptions).toEqual(fromTable);
  });
});

describe('isValidAlpha3', () => {
  it('accepts known ISO alpha-3 codes', () => {
    expect(isValidAlpha3('USA')).toBe(true);
    expect(isValidAlpha3('GHA')).toBe(true);
    expect(isValidAlpha3('FRA')).toBe(true);
    expect(isValidAlpha3('NGA')).toBe(true);
  });

  it('rejects malformed or unknown values', () => {
    expect(isValidAlpha3('')).toBe(false);
    expect(isValidAlpha3('US')).toBe(false);           // alpha-2
    expect(isValidAlpha3('usa')).toBe(false);          // lowercase
    expect(isValidAlpha3('USAA')).toBe(false);         // too long
    expect(isValidAlpha3('U1A')).toBe(false);          // digit
    expect(isValidAlpha3('ZZZ')).toBe(false);          // shape ok, not in catalog
    expect(isValidAlpha3('United States')).toBe(false);
    expect(isValidAlpha3(undefined)).toBe(false);
    expect(isValidAlpha3(null)).toBe(false);
    expect(isValidAlpha3(123)).toBe(false);
  });
});
