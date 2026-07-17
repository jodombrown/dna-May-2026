## Part 1 — SettingsSheet at `/dna/settings`

One PR. Reversible. No schema changes. Legacy `?section=` deep-links preserved.

### Scope

Replace the current grid/sidebar `SettingsLayout` experience at `/dna/settings` with a single Claude-style **SettingsSheet** that uses the already-shipped `IdentitySheet` / `SettingsGroup` / `SettingsRow` primitives. Existing subpage routes (`/dna/settings/account`, `/privacy`, etc.) stay intact as fallbacks so nothing breaks and rollback = revert one route.

### What ships

1. **`src/pages/dna/settings/SettingsSheet.tsx`** (new)
   - Root sheet mounted at `/dna/settings` (also handles bare `/dna/settings` today).
   - Groups (Claude-style grouped lists):
     - **Account** — Name, email, username, password → pushes subview
     - **Privacy** — Public profile, discoverability → pushes subview
     - **Notifications** — Push, email, quiet hours → pushes subview
     - **Preferences** — Appearance, module visibility → pushes subview
     - **Content** — My Hashtags, My Reports, Blocked Users → pushes subview
     - **About** — Version, Terms, Privacy Policy, Sign out, Delete account
   - Each row uses `SettingsRow` with `chevron`, icon, optional value preview.
   - Subviews render the existing panel components (`NotificationPreferencesPanel`, privacy toggles, etc.) inside `IdentitySheet` push transitions — no logic rewrite.

2. **Deep-link compat** (`?section=` and legacy paths)
   - `SettingsSheet` reads `?section=account|privacy|notifications|preferences|hashtags|reports|blocked` on mount and auto-pushes that subview.
   - Legacy routes `/dna/settings/account` etc. keep working: they render `<Navigate to="/dna/settings?section=account" replace />` OR keep their standalone `SettingsLayout` page (whichever is safer per route — default: redirect, since content is identical inside the sheet).
   - Back button / `Esc` pops one level; closing the sheet returns to `/dna/feed` (or previous route from `location.state.from`).

3. **Mount point**
   - `src/App.tsx`: `/dna/settings` renders `SettingsSheet` inside `DnaMobileHubShell` (mobile) or as a right-side panel over the current page (desktop) — same primitive, responsive via `IdentitySheet`.
   - Old `/dna/settings` index (grid) is removed from the route table; subroutes remain for now.

4. **Rollback**
   - Single flag `SETTINGS_SHEET_V2` in `src/config/featureFlags.ts` (default `true`). Flipping to `false` re-mounts the legacy `SettingsLayout` grid page. No data, no schema touched.

### Files touched

- **New:** `src/pages/dna/settings/SettingsSheet.tsx`, `src/pages/dna/settings/sheet/AccountSubview.tsx`, `PrivacySubview.tsx`, `NotificationsSubview.tsx`, `PreferencesSubview.tsx`, `ContentSubview.tsx`, `AboutSubview.tsx` (thin wrappers around existing panels).
- **Edit:** `src/App.tsx` (route mount), `src/config/featureFlags.ts` (add flag), `src/pages/dna/settings/index.ts` (export).
- **Untouched:** all existing `AccountSettings.tsx`, `PrivacySettings.tsx`, etc. — kept as-is behind the legacy flag path so nothing regresses.

### Explicitly out of scope (next parts)

- Account drawer refit (Part 2)
- Public profile editorial redesign (Part 3)
- Backend `rpc_get_profile_bundle_v2` / `profile_footprint_counts` MV / JSONB prefs (Part 4)
- Composer sub-screens visual refresh (Part 5)

### Verification

- Visit `/dna/settings` → sheet opens with 6 groups.
- Visit `/dna/settings?section=notifications` → sheet opens pre-pushed to Notifications.
- Visit `/dna/settings/account` → redirects into sheet at Account subview.
- Flip `SETTINGS_SHEET_V2=false` → old grid returns.
- No TypeScript errors; no schema migrations; no edge function changes.
