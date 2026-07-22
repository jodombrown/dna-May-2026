/**
 * EditedMarker — the BD160 honesty marker.
 *
 * Shows "Edited {relative time}" next to a post's timestamp, for EVERY viewer
 * (anon, other members, and the author) whenever `editedAt` is set. That
 * universality is the guarantee: a signed-out visitor on a public edited post
 * still sees that it was edited.
 *
 * The AUTHOR (isOwn) additionally gets a tap target that opens their revision
 * history. Non-authors get the text with no interaction — prior content is
 * author-only (matches post_revisions' RLS and the BD162 consent logic).
 *
 * Presentational only; it inherits the muted text style of the timestamp it
 * sits beside.
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { PostRevisionHistory } from './PostRevisionHistory';

interface EditedMarkerProps {
  editedAt: string | null | undefined;
  postId: string;
  isOwn: boolean;
}

export function EditedMarker({ editedAt, postId, isOwn }: EditedMarkerProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  if (!editedAt) return null;

  const label = `Edited ${formatDistanceToNow(new Date(editedAt), { addSuffix: true })}`;

  // Non-authors: plain, non-interactive text. No tap-through to prior content.
  if (!isOwn) {
    return <span>{label}</span>;
  }

  // Author: the marker opens their own revision history.
  return (
    <>
      <button
        type="button"
        onClick={() => setHistoryOpen(true)}
        className="underline-offset-2 hover:underline"
      >
        {label}
      </button>
      <PostRevisionHistory postId={postId} open={historyOpen} onOpenChange={setHistoryOpen} />
    </>
  );
}
