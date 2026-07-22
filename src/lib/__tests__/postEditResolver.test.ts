/**
 * postEditResolver dispatch — one case per post_type, plus the fail-closed
 * cases (envelope verbs with a missing linked id, community_post, bogus type).
 *
 * The load-bearing invariant: an envelope verb NEVER degrades to editing the
 * posts row when its link is missing. It refuses.
 */

import { describe, it, expect } from 'vitest';
import { resolvePostForEdit } from '@/lib/postEditResolver';

const item = (over: Partial<Parameters<typeof resolvePostForEdit>[0]>) => ({
  post_id: 'p1',
  post_type: 'post',
  ...over,
});

describe('resolvePostForEdit — dispatch', () => {
  it('post/status/connect → posts row (the post is the artifact)', () => {
    expect(resolvePostForEdit(item({ post_type: 'post' }))).toEqual({
      target: 'posts', postType: 'post', recordId: 'p1',
    });
    expect(resolvePostForEdit(item({ post_type: 'status' }))).toEqual({
      target: 'posts', postType: 'status', recordId: 'p1',
    });
    expect(resolvePostForEdit(item({ post_type: 'connect' }))).toEqual({
      target: 'posts', postType: 'connect', recordId: 'p1',
    });
  });

  it('story → posts row', () => {
    expect(resolvePostForEdit(item({ post_type: 'story' }))).toEqual({
      target: 'posts', postType: 'story', recordId: 'p1',
    });
  });

  it('space → spaces row via linked_entity_id', () => {
    expect(
      resolvePostForEdit(item({ post_type: 'space', linked_entity_id: 's9' }))
    ).toEqual({ target: 'spaces', recordId: 's9', envelopePostId: 'p1' });
  });

  it('need → opportunities row via linked_entity_id', () => {
    expect(
      resolvePostForEdit(item({ post_type: 'need', linked_entity_id: 'o7' }))
    ).toEqual({ target: 'opportunities', recordId: 'o7', envelopePostId: 'p1' });
  });

  it('event → eventForm, preferring event_id over linked_entity_id', () => {
    expect(
      resolvePostForEdit(item({ post_type: 'event', event_id: 'e3', linked_entity_id: 'x' }))
    ).toEqual({ target: 'eventForm', eventId: 'e3' });
    // Falls back to linked_entity_id when event_id is absent.
    expect(
      resolvePostForEdit(item({ post_type: 'event', linked_entity_id: 'e4' }))
    ).toEqual({ target: 'eventForm', eventId: 'e4' });
  });

  it('reshare → commentary on the reshare post', () => {
    expect(resolvePostForEdit(item({ post_type: 'reshare' }))).toEqual({
      target: 'commentary', postId: 'p1',
    });
  });

  it('community_post → refuse (editing not supported)', () => {
    const plan = resolvePostForEdit(item({ post_type: 'community_post' }));
    expect(plan.target).toBe('refuse');
  });

  it('unknown post_type → refuse', () => {
    const plan = resolvePostForEdit(item({ post_type: 'totally_bogus' }));
    expect(plan).toEqual({ target: 'refuse', reason: 'unknown post_type: totally_bogus' });
  });
});

describe('resolvePostForEdit — fail closed on missing envelope link', () => {
  it('space without linked_entity_id → refuse, NOT a posts edit', () => {
    const plan = resolvePostForEdit(item({ post_type: 'space', linked_entity_id: null }));
    expect(plan.target).toBe('refuse');
  });

  it('need without linked_entity_id → refuse, NOT a posts edit', () => {
    const plan = resolvePostForEdit(item({ post_type: 'need' }));
    expect(plan.target).toBe('refuse');
  });

  it('event without event_id or linked_entity_id → refuse', () => {
    const plan = resolvePostForEdit(item({ post_type: 'event', event_id: null, linked_entity_id: null }));
    expect(plan.target).toBe('refuse');
  });
});
