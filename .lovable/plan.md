## Problem

The Post composer lets you attach multiple images (via `MultiAttachmentUploader`), and the form correctly tracks them as `mediaUrl` (first image) + `galleryUrls` (the rest). But when the post is submitted, the extra images are silently dropped, so the published post only ever shows one image.

There are two breaks in the pipeline:

1. **Submit handler drops gallery** - `MODE_HANDLERS.post.submit` in `src/components/composer/modeHandlers.ts` only passes `data.mediaUrl` to `createStandardPost`. It never forwards `data.galleryUrls`.
2. **Writer never stores gallery** - `createStandardPost` in `src/lib/feedWriter.ts` has no `galleryUrls` parameter and doesn't write the `posts.gallery_urls` column (the column exists in the DB and is already used by stories).
3. **PostCard only renders one image** - `src/components/posts/PostCard.tsx` only renders `post.image_url`. Even once we persist the gallery, a standard post will still look single-image.

The DB already has `posts.gallery_urls` (text[]), and `feedService` already maps `image_url + gallery_urls` into a unified `media` array on read - so the read side mostly works; we just need to write the array and render it.

## Plan

### 1. Persist the gallery on submit

`src/lib/feedWriter.ts` - `createStandardPost`:
- Add optional `galleryUrls?: string[]` param.
- Include `gallery_urls: galleryUrls && galleryUrls.length ? galleryUrls : null` in the insert payload.
- Include `gallery_urls` in the `.select(...)` projection.
- Map it onto the returned `PostWithAuthor` (extend the type with `gallery_urls?: string[] | null` if not already present).

`src/components/composer/modeHandlers.ts` - `post.submit`:
- Pass `galleryUrls: data.galleryUrls` into `createStandardPost`.
- Include `gallery_urls` on the optimistic `createdPost` returned by `buildUniversalFeedItemForPost` so the new post shows all images immediately in the feed without a refetch.
- Add `galleryUrls: []` to `post.getDefaultValues` so the field is initialized cleanly.

### 2. Render multiple images in PostCard

`src/components/posts/PostCard.tsx`:
- Where it currently renders the single `post.image_url` block (around line 352), branch on whether a gallery is present:
  - If `post.gallery_urls?.length` (combined with `image_url`), render a small responsive image grid (1 image = current full-width treatment; 2 = side-by-side; 3 = one large + two stacked; 4+ = 2x2 with "+N" overlay on the last tile).
  - Reuse the existing lightbox/click-to-open behavior already wired for `image_url`.
- Keep video handling unchanged - galleries are images only (the composer's uploader is image-only for posts).
- Update the `PostWithAuthor` type used by `PostCard` to include `gallery_urls?: string[] | null`, and ensure the mapping in `UniversalFeedItem.tsx` forwards it from `item.gallery_urls` / `feedService`'s `media` array.

### 3. Verification

- Create a post with 1, 2, 3, and 5 images via the composer.
- Confirm all images appear in the feed card and reload-survives (DB row has the array).
- Confirm single-image posts still render exactly as before (no visual regression).
- Confirm reshare/quote rendering still works (only reshares of standard posts - reshare path can keep showing the primary `image_url` for now to avoid scope creep; flagged but not changed).

### Out of scope

- Story gallery uploader (already works).
- Reshare card multi-image rendering (single-image preserved; can be a follow-up).
- Video galleries / mixed media.

### Technical notes

- DB column already exists: `posts.gallery_urls text[]` - no migration needed.
- `feedService` already returns gallery URLs to the client; no read-path query change required.
- Order matters: the composer treats the first image as the "primary" (`mediaUrl` -> `image_url`) and the rest as `galleryUrls` -> `gallery_urls`, preserving user-selected order.
