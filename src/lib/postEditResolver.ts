/**
 * postEditResolver — the BD159 edit dispatcher
 *
 * "Edit" targets the SOURCE RECORD, not the feed card. Four of the nine
 * post_type values are envelopes over a separate table (spaces, opportunities,
 * events, reshares); editing one must open the row it wraps, not the posts row.
 *
 * This resolver is PURE and FETCH-FREE. It reads only post_type and the id
 * fields a plan needs, and returns a discriminated union naming the edit target
 * plus the id(s) the caller must fetch. It does NOT fetch and does NOT call
 * hydrate — the caller fetches the named record, then runs the handler's
 * hydrate to build the seed.
 *
 * FAIL CLOSED: for envelope verbs (space/need/event) a missing linked id is a
 * `refuse`, never a silent fall back to editing the posts row. A missing
 * envelope link means we cannot know we are editing the right thing.
 */

export type PostEditPlan =
  | { target: 'posts';         postType: string; recordId: string }
  | { target: 'spaces';        recordId: string; envelopePostId: string }
  | { target: 'opportunities'; recordId: string; envelopePostId: string }
  | { target: 'eventForm';     eventId: string }
  | { target: 'commentary';    postId: string }   // reshare
  | { target: 'refuse';        reason: string };

export function resolvePostForEdit(item: {
  post_id: string;
  post_type: string;
  linked_entity_type?: string | null;
  linked_entity_id?: string | null;
  event_id?: string | null;
}): PostEditPlan {
  const { post_id, post_type, linked_entity_id, event_id } = item;

  switch (post_type) {
    // Plain posts: the post IS the artifact (connect has no separate table).
    case 'post':
    case 'status':
    case 'connect':
      return { target: 'posts', postType: post_type, recordId: post_id };

    case 'story':
      return { target: 'posts', postType: 'story', recordId: post_id };

    // Envelope over spaces — edit the space row, not the post.
    case 'space':
      if (!linked_entity_id) {
        return { target: 'refuse', reason: 'space post missing linked_entity_id' };
      }
      return { target: 'spaces', recordId: linked_entity_id, envelopePostId: post_id };

    // Envelope over opportunities.
    case 'need':
      if (!linked_entity_id) {
        return { target: 'refuse', reason: 'need post missing linked_entity_id' };
      }
      return { target: 'opportunities', recordId: linked_entity_id, envelopePostId: post_id };

    // Envelope over events — the unified EventForm owns event editing.
    case 'event': {
      const eventId = event_id ?? linked_entity_id;
      if (!eventId) {
        return { target: 'refuse', reason: 'event post missing event_id and linked_entity_id' };
      }
      return { target: 'eventForm', eventId };
    }

    // Reshare edits the commentary on the reshare post itself.
    case 'reshare':
      return { target: 'commentary', postId: post_id };

    case 'community_post':
      return { target: 'refuse', reason: 'community_post editing not supported' };

    default:
      return { target: 'refuse', reason: `unknown post_type: ${post_type}` };
  }
}
