import { describe, it, expect } from 'vitest';
import {
  curatedHostName,
  curatedSourceDomain,
  isStockImage,
  realCuratedCover,
} from './curated';

describe('curatedHostName — BD214 host guard', () => {
  // The regression this phase exists to prevent: a curated row that also
  // carries an organizer_name (the DNA-side profile join on organizer_id)
  // must still lead with the SOURCE DOMAIN, never the DNA Member's name.
  it('renders the domain, not organizer_name, for a curated event carrying both', () => {
    expect(
      curatedHostName({
        organizer_name: 'Jaûne Lamarro', // whoever created the row inside DNA
        curated_source: 'perplexity',
        curated_source_url: 'https://aadconference.africa',
      }),
    ).toBe('aadconference.africa');
  });

  it('treats a source URL alone as curated provenance and refuses organizer_name', () => {
    expect(
      curatedHostName({
        organizer_name: 'Some DNA Member',
        curated_source_url: 'https://www.nyadiff.org',
      }),
    ).toBe('nyadiff.org');
  });

  it('uses organizer_name for a member-hosted event (no curated provenance)', () => {
    expect(curatedHostName({ organizer_name: 'Ama Boateng' })).toBe('Ama Boateng');
  });

  it('falls back to the domain when a curated event names no organizer', () => {
    expect(
      curatedHostName({
        curated_source: 'perplexity',
        curated_source_url: 'https://festivalofthediaspora.org',
      }),
    ).toBe('festivalofthediaspora.org');
  });

  it("returns '' — never a leaked member name — when a curated row has no usable source", () => {
    expect(
      curatedHostName({
        organizer_name: 'Some DNA Member',
        curated_source: 'perplexity',
        curated_source_url: null,
      }),
    ).toBe('');
  });

  it('resolves the five live curated sources to their real hosts', () => {
    const cases: Array<[string, string]> = [
      ['https://aadconference.africa', 'aadconference.africa'],
      ['https://nationalafsa.org/event/conference-2026/', 'nationalafsa.org'],
      ['https://www.diasporaafricaconference.com', 'diasporaafricaconference.com'],
      ['https://www.nyadiff.org', 'nyadiff.org'],
      ['https://festivalofthediaspora.org', 'festivalofthediaspora.org'],
    ];
    for (const [url, host] of cases) {
      expect(
        curatedHostName({
          organizer_name: 'A DNA Member', // the leak that BD214 closes
          curated_source: 'perplexity',
          curated_source_url: url,
        }),
      ).toBe(host);
    }
  });
});

describe('curatedSourceDomain', () => {
  it('strips the www. prefix and the path', () => {
    expect(curatedSourceDomain('https://www.nyadiff.org/events/x?y=1')).toBe('nyadiff.org');
  });

  it('returns empty string for junk', () => {
    expect(curatedSourceDomain('not a url')).toBe('');
    expect(curatedSourceDomain(null)).toBe('');
    expect(curatedSourceDomain(undefined)).toBe('');
  });
});

describe('realCuratedCover / isStockImage', () => {
  it('refuses constructed Unsplash covers', () => {
    const url = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop';
    expect(isStockImage(url)).toBe(true);
    expect(realCuratedCover({ cover_image_url: url })).toBeNull();
  });

  it('passes a real source-hosted cover through', () => {
    const url = 'https://nyadiff.org/assets/cover.jpg';
    expect(isStockImage(url)).toBe(false);
    expect(realCuratedCover({ cover_image_url: url })).toBe(url);
  });

  it('returns null when there is no cover', () => {
    expect(realCuratedCover({ cover_image_url: null })).toBeNull();
  });
});
