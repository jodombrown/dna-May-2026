
# Public Profile: Owner View, Chrome Removal, and Five C's Discovery Sheet

Three related fixes to `/dna/:username`, packaged as one architectural change so the signed-in owner view, signed-in-visitor view, and signed-out visitor view finally form a closed loop.

## 1. The bug: owner sees visitor UI on own profile

**Symptom (screenshot 1):** signed in as `@jaunelamarro`, visiting `/dna/jaunelamarro`, the page renders a Connect button, share, message icon, and "0 followers · 1 following" visitor framing.

**Root cause:** `src/pages/ProfileV2.tsx` line 171 falls back to `bundle.permissions?.is_owner`, but the `rpc_get_profile_bundle` RPC is not stamping `is_owner: true` when `p_viewer_id === profile.id`. Everything downstream (`ProfileV2Hero`, connection widgets, mutual connections) is gated on `permissions.is_owner`, so a false negative from the RPC cascades into the whole page rendering as a stranger's view.

**Fix, in order:**
- Add a client-side guard in `ProfileV2.tsx`: `const isOwner = rawIsOwner || (!!user && user.id === profile.id)`. This makes the UI correct even if the RPC lies. Every downstream `permissions.is_owner` read uses this derived value.
- Fix `rpc_get_profile_bundle` in a migration: it must return `is_owner = (p_viewer_id = profiles.id)` in the `permissions` jsonb, and must never set `should_show_public_landing = true` when the viewer is the owner.
- Certify by impersonation (four personas per the RLS skill): owner, authenticated non-owner, anon, service_role. Prove owner sees edit affordances and no Connect CTA; non-owner sees Connect; anon gets the public landing view. Do all three in one rolled-back transaction against a seeded fixture profile so we don't ship the "positive without the negative" a second time.

## 2. Remove the "← DNA / Join DNA" chrome universally

**Symptom (screenshot 2):** a fixed top bar with a left-arrow "DNA" link and a "Join DNA" button appears on public profiles when signed out, and (per the user) also bleeds into signed-in views on some paths.

**Source:** `src/components/profile-v2/PublicProfileLandingView.tsx` lines 181–205 (`motion.header` with `ArrowLeft` + "Join DNA" button). `src/components/public-profile/PublicProfileHeader.tsx` is a second copy of the same pattern.

**Fix:**
- Delete the fixed `motion.header` block from `PublicProfileLandingView.tsx`. Remove the `pt-14` offset on the banner that compensated for it.
- Delete `PublicProfileHeader.tsx` and its export from `src/components/public-profile/index.ts`. Grep for any remaining import and remove.
- Signed-out public pages already have access to the site-wide public header via the app shell; if a public route currently mounts without one, mount `PublicSiteHeader` at the layout level, not per-page. One header, one place.
- The "Join the Waitlist" CTA stays on the profile body (already there per screenshot 2 and matches the current `WAITLIST_MODE` flag). We are removing chrome, not the primary CTA.

## 3. Five C's discovery block on every signed-out profile, with a right-sheet detail

**What the user wants:**
- The Five C's card row from screenshot 3 renders at the bottom of every signed-out profile page (below About and existing CTAs).
- Each card is clickable. Clicking opens a right-side sheet (same pattern used elsewhere in the platform) showing the C's detail view (screenshots 4–8: Connect, Convene, Collaborate, Contribute, Convey), each with Overview / What You Can Do / Who It Is For / How It Connects To The Other C's / What Is Coming.
- This block is the same on every signed-out profile. Signed-in users do not see it on `/dna/:username`.

**Architecture:**
- **New content module:** `src/content/fiveCs.content.ts` exports a typed array `FIVE_CS: FiveCEntry[]` with `{ id, name, tagline, adinkraIcon, colorToken, overview, whatYouCanDo[], whoItIsFor, howItConnects, whatIsComing[] }`. Source of truth for both the card row and the sheet, so we never drift between screenshots 3 and 4–8.
- **New card row:** `src/components/five-cs/FiveCsDiscoveryRow.tsx`. Reads `FIVE_CS`, renders five cards using the existing Adinkra icon set (Sankofa, Nkonsonkonson, Funtunfunefu, Adinkrahene, Mpatapo per the iconography memory), semantic tokens only, no purple / no arbitrary values. Each card is a button that dispatches `onOpen(id)`.
- **New sheet:** `src/components/five-cs/FiveCDetailSheet.tsx`. Uses `ResponsiveModal` (Radix Sheet with `side="right"` on desktop, Vaul Drawer on mobile per the responsive-modal memory). Renders the selected `FiveCEntry` with the exact section order in screenshots 4–8. Includes a footer CTA row: "Join the Waitlist" (primary) and "Learn more about DNA" (secondary, links to the C's hub route once signed in - for signed-out it stays inside the sheet).
- **New container:** `src/components/five-cs/FiveCsDiscoverySection.tsx` owns the `openId` state, renders `FiveCsDiscoveryRow` + `FiveCDetailSheet`. This is the single import point.
- **Mount point:** `PublicProfileLandingView.tsx`, appended after the existing About + CTA blocks. Because it lives on the public landing view component, it automatically appears on every signed-out profile without touching individual pages.
- **Universality guarantee:** the section is not gated on any per-profile flag. Every signed-out `/dna/:username` (public or not) that renders `PublicProfileLandingView` gets it. The private-profile branch in `ProfileV2.tsx` also renders it, so even a locked profile still educates the visitor about the platform.

## 4. Closed loop and flow

The three fixes are one loop:

1. **Owner** lands on own profile: sees edit affordances, profile strength, no Connect/Message-as-visitor artifacts, no "Join DNA" banner (chrome is gone globally).
2. **Signed-in non-owner** lands on someone's profile: sees the current Connect / Message / Share flow, no "Join DNA" banner, no Five C's discovery block (they are already in).
3. **Signed-out visitor** lands on a profile: sees the profile body, About, "Join the Waitlist" CTA, and the Five C's discovery row. Clicking any C opens the right-sheet with the full explainer, ending in the same waitlist CTA. Every path out of the sheet goes to `/waitlist`.

One entry (the profile URL), one exit (the waitlist), five doors of context in between.

## 5. What I'd add that you did not ask for

- **Analytics events** on the Five C's row: `five_cs_card_open` with `{ c_id, source: 'public_profile', username }`. Without this we can't tell which C is the actual conversion driver for waitlist signups.
- **SEO:** the sheet content lives in the DOM (not lazy-loaded) so crawlers indexing a public profile also index "what DNA is." Set the sheet container to `hidden` via `data-state` rather than unmount, so the content stays in HTML.
- **Keyboard + a11y:** each card is a real `<button>`, the sheet traps focus, `Esc` closes, right-arrow / left-arrow cycles between C's inside the sheet. This is the pattern the platform already uses; call it out so it's not skipped.
- **One migration, one certification, one deploy.** The RPC fix, the chrome deletion, and the new discovery section ship as three commits under one BD number, but they land together. Owner-view correctness is not certified against non-owner correctness unless both are proved in the same rolled-back fixture transaction (per the RLS skill).
- **Do not reintroduce `PublicProfileHeader`.** Add a lint note in `src/components/public-profile/index.ts` (or delete the folder if it becomes empty) so a future agent doesn't recreate it.

## 6. Files touched

- `src/pages/ProfileV2.tsx` - derive `isOwner` client-side; use it everywhere `permissions.is_owner` is currently read.
- `src/components/profile-v2/PublicProfileLandingView.tsx` - delete fixed header; mount `FiveCsDiscoverySection`.
- `src/components/public-profile/PublicProfileHeader.tsx` - delete.
- `src/components/public-profile/index.ts` - remove export.
- `src/content/fiveCs.content.ts` - new.
- `src/components/five-cs/FiveCsDiscoveryRow.tsx` - new.
- `src/components/five-cs/FiveCDetailSheet.tsx` - new.
- `src/components/five-cs/FiveCsDiscoverySection.tsx` - new.
- `supabase/migrations/<ts>_rpc_get_profile_bundle_owner_flag.sql` - fix `is_owner` and `should_show_public_landing` in the RPC; grant unchanged.

## 7. Certification gate (before calling this done)

- Signed-in as owner on own `/dna/:username`: no Connect button, no Message-as-visitor icon, no "Join DNA" banner. Edit affordance present.
- Signed-in as a different user on that same URL: Connect button present, no "Join DNA" banner, no Five C's block.
- Signed out on that same URL: Waitlist CTA present, Five C's row present, clicking each of the five opens the right-sheet with the correct copy from screenshots 4–8, sheet CTA routes to `/waitlist`.
- Four-persona impersonation transcript on `rpc_get_profile_bundle` attached: owner / auth non-owner / anon / service_role, each showing what `is_owner` and `should_show_public_landing` come back as.
- `rg "PublicProfileHeader"` returns zero hits.
- `rg "Join DNA" src/components/profile-v2` returns zero hits.
