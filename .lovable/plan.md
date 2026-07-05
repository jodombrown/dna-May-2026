## Why comments fail

Every insert into `post_comments` returns Postgres error `42703: record "new" has no field "author_id"`.

Root cause: the `notify_post_comment()` trigger (last rewritten in `supabase/migrations/20251106174913_*.sql`) references `NEW.author_id` twice, but the `post_comments` table uses `user_id` (not `author_id`) for the commenter. The trigger fires on every INSERT and aborts the whole request, so the UI shows "Failed to post comment."

Other tables (`posts`, `comments`, `event_comments`) do use `author_id`, which is where the mismatch crept in.

## Fix

Add one new migration that redefines `notify_post_comment()` using the correct column:

- Replace `NEW.author_id` -> `NEW.user_id` in both the `create_notification` call and the `full_name` lookup.
- Keep everything else (SECURITY DEFINER, search_path, target = post author, self-comment allowed) unchanged. If we want, we can also skip notifying when the commenter is the post author (nice-to-have, not required to unblock).

No frontend changes needed. `PostComments.tsx` already inserts `{ post_id, user_id, content }`, which matches the table.

## Verification

1. Reload `/dna/feed`, expand a post, type a comment, press Enter.
2. Network tab: `POST /rest/v1/post_comments` returns 201.
3. Comment appears in the list, and the post author gets a notification row.
