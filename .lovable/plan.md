## Part 2b — Account drawer replaced by IdentitySheet + Part 4 backend consolidation + legacy cleanup

### 1. Rebuild the Account drawer in the new Settings sheet language

Screenshot 1 (the old `AccountDrawer` with big "View full profile" pill, Edit / Share buttons, then MY ACTIVITY / COLLABORATE / ACCOUNT lists) becomes the same visual language as Screenshot 2 (the new `SettingsSheet`).

New file: `src/components/navigation/AccountDrawerV2.tsx`.

Structure inside a shared `IdentitySheet` titled **Account**:

```
[avatar] Jaûne Odombrown            >     (tap → pushes Profile edit subpage)
         @jaunelamarro
         United States

MY WORK
  • My posts & updates    >
  • My stories            >
  • My spaces             >
  • My events             >
  • Saved items           >

ACCOUNT
  • Settings & preferences  >   (pushes the full SettingsSheet body inside)
  • View public profile     >   (navigates to /dna/:username)
  • Share my profile        >   (opens ProfileShareDropdown)
  • Take platform tour      >
  • Alpha test guide        >
  • Help & feedback         >

Sign out
```

Every row is a `SettingsRow` with a chevron. "Settings & preferences" pushes the same subpages the settings sheet uses — no separate stacked sheet, just one identity sheet. This gives the user a single continuous back-stack from `Account → Settings & preferences → Profile → …` without ever leaving the sheet.

Old `AccountDrawer.tsx` (the 382-line legacy drawer with pill, Edit/Share buttons, dropdown menu) is deleted. `AccountDrawerContext` stays and now drives `AccountDrawerV2`.

### 2. Stop the feed from being disturbed when the sheet opens

Cause: Radix Dialog (used by the desktop path of `IdentitySheet`) locks `<body>` scroll and adds `padding-right` to compensate for the scrollbar. That's the visible "the feed gets removed / shifts" behavior in Screenshot 3.

Fix in `IdentitySheet.tsx`:
- Desktop uses a right-anchored panel that does NOT scroll-lock the underlying app. Replace Radix Dialog with a plain portal + fixed panel + focus-trap. Overlay stays as a click-to-close scrim but does not touch `<body>` styles.
- Result: opening/closing the sheet leaves the feed's scroll position and horizontal layout untouched. The `DnaRightRail` / feed grid does not reflow.

Mobile behavior (Vaul bottom sheet) is unchanged.

### 3. Kill all legacy settings routes and the feature flag

- Delete `src/config/featureFlags.ts` `SETTINGS_SHEET_V2` and every reference. `SettingsSheet` at `/dna/settings` is the standard, unconditionally.
- Delete `src/pages/dna/settings/SettingsRouteShell.tsx`, `src/components/settings/SettingsLayout.tsx`, `MobileSettingsView`, `MobileSettingsMainContent`.
- Convert the six standalone settings routes to redirects that keep email deep-links working:

```
/dna/settings/account         → /dna/settings?section=account
/dna/settings/privacy         → /dna/settings?section=privacy
/dna/settings/blocked         → /dna/settings?section=blocked
/dna/settings/reports         → /dna/settings?section=reports
/dna/settings/notifications   → /dna/settings?section=notifications
/dna/settings/preferences     → /dna/settings?section=preferences
/dna/settings/hashtags        → /dna/settings?section=hashtags
```

The `SettingsSheet` already handles `?section=` on mount, so every legacy URL lands the user on the right subpage inside the new sheet.

### 4. Part 4 — Backend consolidation (additive migration)

One migration, no schema break, no CASCADE:

1. `profiles.profile_settings jsonb not null default '{}'` — sheet-scoped prefs (appearance, haptics, digest cadence, mapbox flag). No new table.
2. Materialized view `public.profile_footprint_counts` (columns: `profile_id`, `connections`, `events_hosted`, `events_attended`, `active_spaces`, `contributions_given`, `stories`). Unique index on `profile_id`. `GRANT SELECT` to `anon, authenticated`, `GRANT ALL` to `service_role`.
3. `pg_cron` refresh every 15 min via `REFRESH MATERIALIZED VIEW CONCURRENTLY`.
4. Extend the existing `rpc_get_profile_bundle` to include a `footprint_counts` key from the MV in its JSON payload. No new RPC.

Front-end wiring:
- New hook `src/hooks/useSettingsPrefs.ts`: reads/writes `profiles.profile_settings` with a 300 ms debounced optimistic update through TanStack Query. No realtime.
- `useProfileV2` picks up `footprint_counts` automatically once the RPC returns it. `DiasporaFootprint` reads from `bundle.footprint_counts` instead of its per-count queries — one call replaces six.

Everything is additive; existing components keep working until they're switched over.

### 5. Out of scope for this turn

- Notifications center, My reports, Blocked users list conversions (Part 5, one PR each).
- Composer secondary screens (Part 5).
- Public profile hero further polish beyond what Part 3 already shipped.

### Acceptance

- Tapping the avatar in the header opens the new IdentitySheet-styled Account view. Screenshot 1's legacy pill/dropdown layout is gone.
- Opening/closing the sheet does not shift, scroll, or blank the feed grid. The right rail stays put. Content behind is dimmed but layout is untouched.
- Every legacy `/dna/settings/{section}` URL still lands the user in the correct subpage of the new sheet.
- `SETTINGS_SHEET_V2` flag and `SettingsRouteShell` are gone from the tree.
- One RPC call powers the public profile page (verifiable in the Network tab).
- Migration passes; new column has default; MV is populated on refresh.
