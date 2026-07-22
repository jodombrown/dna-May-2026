/**
 * Edit round-trip — the load-bearing test for BD159 post editing.
 *
 * For each verb: build a source-record fixture, run the handler's `hydrate`
 * (record -> edit seed), then feed that seed back through seedToFormData — the
 * SAME function <UniversalComposer> uses to build what it submits on create.
 * The resulting ComposerFormData must equal what would have created the fixture.
 * If the inverse dropped or corrupted a field, one of these assertions fails.
 *
 * There is ONE forward implementation (seedToFormData) shared by the component
 * and this test — the mapping is never duplicated here.
 */

import { describe, it, expect } from 'vitest';
import {
  MODE_HANDLERS,
  type PostsRecord,
  type SpacesRecord,
  type OpportunitiesRecord,
} from '@/components/composer/modeHandlers';
import { seedToFormData } from '@/components/composer/composerFormData';

describe('connect round-trip (posts row)', () => {
  // metadata carries the two rendered keys (intent, where), the unrendered-but-
  // known `sector`, AND `campaign`, a key the field UI never surfaces at all.
  const metadata = {
    intent: 'Co-founder',
    where: 'Kigali',
    sector: 'Clean energy',
    campaign: 'diaspora-2026',
  };
  const record: PostsRecord = {
    content: 'Looking for a technical co-founder for a clean-energy venture.',
    metadata,
    image_url: 'https://img.example/hero.jpg',
    gallery_urls: ['https://img.example/1.jpg', 'https://img.example/2.jpg'],
  };

  const seed = MODE_HANDLERS.connect.hydrate!(record);
  const formData = seedToFormData('connect', seed);

  it('reconstructs the ComposerFormData that would have created the record', () => {
    expect(formData).toEqual({
      content: 'Looking for a technical co-founder for a clean-energy venture.',
      mediaUrl: 'https://img.example/hero.jpg',
      galleryUrls: ['https://img.example/1.jpg', 'https://img.example/2.jpg'],
      intent: 'Co-founder',
      where: 'Kigali',
    });
  });

  it('maps every column the forward submit reads back to its field', () => {
    expect(formData?.content).toBe(record.content);
    expect(formData?.intent).toBe(metadata.intent);
    expect(formData?.where).toBe(metadata.where);
    expect(formData?.mediaUrl).toBe(record.image_url);
    expect(formData?.galleryUrls).toEqual(record.gallery_urls);
  });

  it('carries the WHOLE metadata blob through untouched — including sector AND the unrendered campaign key', () => {
    // This is the anti-drop guarantee: an edit cannot silently lose a metadata
    // key just because no field component renders it.
    expect(seed.metadataPassthrough).toEqual(metadata);
    expect(seed.metadataPassthrough).toEqual({
      intent: 'Co-founder',
      where: 'Kigali',
      sector: 'Clean energy',
      campaign: 'diaspora-2026',
    });
    // The arbitrary keys never leak into the string-typed fields bag.
    expect(seed.fields).not.toHaveProperty('campaign');
    // sector is hydrated into fields (a known key) but not re-emitted forward,
    // exactly as the create path never wrote it from a field.
    expect(seed.fields.sector).toBe('Clean energy');
    expect(formData).not.toHaveProperty('sector');
  });
});

describe('story round-trip (posts row)', () => {
  const record: PostsRecord = {
    content: 'The full body of a diaspora story, several paragraphs long.',
    title: 'From London to Lagos',
    image_url: 'https://img.example/story-hero.jpg',
    gallery_urls: ['https://img.example/story-1.jpg'],
    metadata: null,
  };

  const seed = MODE_HANDLERS.story.hydrate!(record);
  const formData = seedToFormData('story', seed);

  it('reconstructs the create ComposerFormData', () => {
    expect(formData).toEqual({
      content: 'The full body of a diaspora story, several paragraphs long.',
      mediaUrl: 'https://img.example/story-hero.jpg',
      galleryUrls: ['https://img.example/story-1.jpg'],
      title: 'From London to Lagos',
      heroImage: 'https://img.example/story-hero.jpg',
    });
  });

  it('maps title/body/hero/gallery back to their columns', () => {
    expect(formData?.title).toBe(record.title);
    expect(formData?.content).toBe(record.content);
    expect(formData?.heroImage).toBe(record.image_url);
    expect(formData?.galleryUrls).toEqual(record.gallery_urls);
  });
});

describe('space round-trip (spaces row, roles supplied by caller)', () => {
  const record: SpacesRecord = {
    name: 'Solar Education Initiative',
    description: 'Building solar-power literacy across three cities.',
    space_type: 'project',
    cover_image_url: 'https://img.example/space-cover.jpg',
  };
  const roles = ['Solar engineer', 'Curriculum lead'];

  const seed = MODE_HANDLERS.space.hydrate!(record, { roles });
  const formData = seedToFormData('space', seed);

  it('hydrates from the spaces row (never the envelope post) and reconstructs create data', () => {
    expect(formData).toEqual({
      content: 'Building solar-power literacy across three cities.',
      mediaUrl: 'https://img.example/space-cover.jpg',
      galleryUrls: ['https://img.example/space-cover.jpg'],
      title: 'Solar Education Initiative',
      spaceCategory: 'project',
      skillsNeeded: ['Solar engineer', 'Curriculum lead'],
    });
  });

  it('roles come from extra.roles, not the record', () => {
    expect(seed.roles).toEqual(roles);
    expect(formData?.skillsNeeded).toEqual(roles);
  });
});

describe('need round-trip (opportunities row)', () => {
  const record: OpportunitiesRecord = {
    description: 'Offering weekly mentorship to early-stage diaspora founders.',
    direction: 'offer',
    category: 'Mentorship',
    give_what: '4 hrs/week',
    give_to: 'Open to match',
    intended_impact: 'Ship faster',
    image_url: 'https://img.example/op.jpg',
  };

  const seed = MODE_HANDLERS.need.hydrate!(record);
  const formData = seedToFormData('need', seed);

  it('reconstructs the give → to → impact create ComposerFormData', () => {
    expect(formData).toEqual({
      content: 'Offering weekly mentorship to early-stage diaspora founders.',
      mediaUrl: 'https://img.example/op.jpg',
      galleryUrls: [],
      direction: 'offer',
      category: 'Mentorship',
      giveWhat: '4 hrs/week',
      giveTo: 'Open to match',
      intendedImpact: 'Ship faster',
    });
  });

  it('maps the triple back to its columns', () => {
    expect(formData?.giveWhat).toBe(record.give_what);
    expect(formData?.giveTo).toBe(record.give_to);
    expect(formData?.intendedImpact).toBe(record.intended_impact);
    expect(formData?.category).toBe(record.category);
    expect(formData?.direction).toBe(record.direction);
  });
});
