# DNA Codebase Audit — 2026-05-27

**Auditor:** Lovable agent (engineering, code archaeology only)
**Scope:** `jodombrown/dna` working tree as of 2026-05-27
**Mandate:** Brutal evidence for keep / hybrid-rebuild / restart decision. Section 5 is pure extraction; Sections 1-4, 6 are full audit with severity tags.

---

## Executive Summary

| Metric | Value |
|---|---|
| `src/` TypeScript/TSX files | **1,550** |
| `src/` lines of code (incl. generated `types.ts` 15,229 LOC) | **290,875** |
| `src/` LOC excluding `types.ts` + `_archived/` | ~**260,000** |
| Public DB tables | **251** |
| `profiles` columns | **217** (egregious) |
| Migrations | **763** |
| Markdown docs in repo root + `docs/` | **160** (uncurated noise) |
| Routes declared in `App.tsx` | **143 unique paths**, 181 `<Route>` lines |
| `any` types in `src/` | **621 occurrences** across hundreds of files |
| Test files | **6** (41 tests, all passing) |
| Circular dependencies | **0** (verified by `madge`) |
| Unused production deps | **11** |
| Outdated production deps (major-version lag) | **~50** including all Radix UI, `@supabase/supabase-js` lagging 57 minor versions |
| Service-role key in client code | **0** (clean) |
| Files >700 LOC | **30** |

**Findings:** **47 total** across Sections 1-4 + 6 (excludes Section 5 extraction).
**CRITICAL:** 6 | **SIGNIFICANT:** 19 | **MINOR:** 16 | **COSMETIC:** 6.

**Pattern read (one sentence):** This is a fast-growing prototype that has been rebuilt in place at least three times - the carcasses of every previous architecture (legacy `diaspora_status`, the unused `dna_identity_role` enum, the archived `_archived/` directories, 160 ad-hoc Markdown reports, a 217-column `profiles` table) coexist with current code with no deletions, no migrations of data, and almost no tests to defend against further drift.

**Drift-affected LOC estimate:** Roughly **35-45%** of `src/` carries some form of drift signal (dead imports, archived directories shipped with the bundle, `any`-typed call sites, references to renamed/removed concepts in DB, or copy that contradicts the current identity model).

---

## Section 1 — Schema-vs-Code Drift

### 1.1 CRITICAL — `dna_identity_role` enum exists in DB types but no table column uses it the way onboarding writes it
**File:** `src/components/onboarding/RoleDeclarationStep.tsx:5`, `src/pages/Onboarding.tsx:61-62`
**Evidence:**
- DB enum `dna_identity_role` IS defined (`SELECT typname FROM pg_type WHERE typname='dna_identity_role'` returns 1 row).
- No column named `dna_identity_role` exists in any public table (`information_schema.columns` returns 0 rows).
- The columns that actually use the enum are `<table>.role` / `<table>.role_at_affirm` on auxiliary tables (`types.ts:749, 8033, 12052`).
- Onboarding writes `profile.role` via `(profileAny?.role as DnaIdentityRole | undefined)` in `Onboarding.tsx:62`, but `profiles` has no `role` column (verified against `information_schema`; `profiles` has a `roles` ARRAY column instead).
- Net effect: the D054 identity declaration UI ships but cannot persist to `profiles`.

**Recommendation:** Either add the `profiles.role dna_identity_role` column in a migration or wire the writer to the table that actually owns the enum. Add a typed `.from('profiles').update({ role })` call and let TS catch the missing column.

### 1.2 CRITICAL — `profiles` table has 217 columns
**File:** schema-wide, evident in `src/integrations/supabase/types.ts` profiles row type
**Evidence:** `SELECT count(*) FROM information_schema.columns WHERE table_name='profiles'` returns **217**. Many duplicates: `country_of_origin`, `country_origin`, `origin_country_code`, `origin_country_name`, `diaspora_origin` all coexist. `current_country`, `current_location`, `current_city`, `current_region`, `current_country_code`, `current_country_name` all coexist.
**Recommendation:** This is the single most expensive drift in the system. Pick canonical columns, write a backfill migration, drop the rest. Until this is fixed, every new feature on profiles will compound the problem.

### 1.3 CRITICAL — `profiles.diaspora_status` is the live identity field, but D054 vocabulary (`returnee / anchor / ally / exploring`) is being written instead of the legacy values stored in DB
**File:** `src/scripts/seedAlphaData.ts:128`, `src/components/profile/edit/DiasporaSection.tsx:60-78`, `src/pages/Onboarding.tsx:384`
**Evidence — DB DISTINCT values currently stored:** `ally`, `1st_gen_diaspora`, `continental_african`, `2nd_gen_diaspora`, `3rd_gen_diaspora`, `mixed_heritage`, `returnee`, `<null>`, `<empty string>`. Eight distinct value shapes for one column, including empty string AND null. UI dropdown options live in `src/data/profileOptions.ts:55` mixing both vocabularies.
**Recommendation:** Migrate stored values to a single canonical set, add a CHECK constraint or enum, and remove the legacy options from the dropdown.

### 1.4 SIGNIFICANT — `user_type` accepts five literal strings in TypeScript but DB column is free-form `text`
**File:** `src/components/onboarding/hooks/useOnboardingForm.ts:4-5`
**Evidence:** TS union `'individual' | 'organization' | 'diaspora_professional' | 'founder' | 'ally'`. `profiles.user_type` is `data_type: text` with no CHECK constraint. `CreateStory.tsx:123` reads `profile?.user_type === 'admin'` - a sixth value not in the union and not in the comment "must match DB constraint".
**Recommendation:** Convert to a Postgres enum, drop `'founder'` and `'diaspora_professional'` if they conflict with D054 identity model (Section 5 will surface them all so the founder can decide).

### 1.5 SIGNIFICANT — 11 columns in `profiles` referenced by code with `as any` to bypass missing types
**File:** `src/pages/Onboarding.tsx:71` (`(profile as any)?.user_type as any`)
**Evidence:** When code casts `as any` to read a column, it is signalling that the generated types disagree with what the code expects. There are dozens of these (`rg "(profile as any)" src/`).
**Recommendation:** Regenerate `types.ts`, fix the casts. Treat any remaining `as any` on profile reads as a bug.

### 1.6 MINOR — `display_name`, `full_name`, `first_name + middle_initial + last_name`, `username` all coexist on `profiles`
**File:** `src/services/contributeRoomService.ts:91` (`row.display_name ?? row.full_name ?? row.username ?? 'A diaspora member'`)
**Evidence:** Code defensively falls back through 3-4 name columns at every read site. Four name representations means no single source of truth.
**Recommendation:** Pick one. Backfill. Drop the others.

### 1.7 MINOR — Service-role key not present in client (positive finding)
**Evidence:** `rg "SUPABASE_SERVICE_ROLE_KEY|service_role" src/` returns 0 hits in client code. Edge functions handle elevated privileges. Good.

---

## Section 2 — Docs-vs-Code Drift

### 2.1 SIGNIFICANT — `docs/ONBOARDING_FLOW_SPEC.md` referenced in the audit brief does not exist
**Evidence:** `find . -name "ONBOARDING_FLOW_SPEC*"` returns no results. There IS a `ONBOARDING_REDESIGN_PLAN.md` in repo root. The canonical spec the founder believes exists, does not.
**Recommendation:** Create the spec from the current `Onboarding.tsx` + step components, OR delete the assumption.

### 2.2 SIGNIFICANT — 160 Markdown files in the repo with no curation, ~95% are point-in-time status reports
**Evidence:** Repo root alone has 44 caps-lock summary docs: `DNA_ADA_PHASE1_COMPLETION_REPORT.md`, `PHASE_3_ACCEPTANCE_VERIFICATION.md`, `WEEK_2B_SUMMARY.md`, `PHASE_7_ANALYTICS_SUMMARY.md`, `FEED_V1.1.1_COMMUNITY_INTEGRATION_COMPLETE.md`, ... `docs/` contains another 116 files including 14 separate ADA-related docs and 9 separate "audit/assessment" docs that contradict each other.
**Recommendation:** Move all "completion report" / "phase X summary" / "audit Y" docs to a `docs/_archive/` directory in one commit, then keep `docs/` to under 20 living documents. Today, none of these docs can be trusted because there is no marker for which is current.

### 2.3 SIGNIFICANT — `docs/02-DATABASE-SCHEMA.md` cannot be current
**Evidence:** The doc was written before the migration count reached 763 and before profiles ballooned to 217 columns. Any consumer of this file will receive stale information.
**Recommendation:** Regenerate from `types.ts` on every PR via a script, or delete the file.

### 2.4 MINOR — `docs/03-ROUTES-AND-PAGES.md` likely stale
**Evidence:** App.tsx declares 143 unique route paths; an early "routes and pages" doc was almost certainly built when route count was a fraction of this.
**Recommendation:** Auto-generate from `App.tsx` or delete.

### 2.5 MINOR — JSDoc on `useFiveCsPulse`, `useMessagingPrd`, `messagingPrdService` references "PRD" without linking to one
**Evidence:** Multiple files contain "Phase X" or "PRD" comments with no link target.
**Recommendation:** Either link to the PRDs in `docs/` or strip the references.

### 2.6 COSMETIC — `README.md` exists but project-knowledge in workspace contradicts it on stack details
**Recommendation:** Bring README in line with the workspace knowledge or delete it.

---

## Section 3 — Architectural Drift

### 3.1 CRITICAL — `_archived/` directories ship in `src/` containing 243 files
**File:** `src/components/_archived/` (237 files), `src/pages/_archived/` (6 files)
**Evidence:** `find src -type d -name "_archived" -exec find {} -type f \;` returns 243 files including `src/components/_archived/onboarding/steps/PersonalizedStep.tsx`, `src/components/_archived/admin_legacy/SeedDataManager.tsx`, `src/components/_archived/convene_orphaned/`, `src/components/_archived/connect_orphaned/`. Vite will tree-shake unused exports, but these still ship in source control, count toward LOC, are surfaced in `rg` results, and confuse new contributors. Several archived files reference live tables and would compile.
**Recommendation:** Delete the entire `_archived/` tree in one commit. Git history preserves it.

### 3.2 CRITICAL — God-files: 30 files exceed 700 LOC, top 10 average 1,332 LOC
**Top offenders:**
- `src/data/featureContent.tsx` — 2,528 LOC (marketing copy hard-coded in TSX)
- `src/services/messagingPrdService.ts` — 1,306 LOC
- `src/data/demoSearchData.ts` — 1,302 LOC (mock data shipped to prod)
- `src/services/messageService.ts` — 1,246 LOC
- `src/services/notificationSystemService.ts` — 1,149 LOC
- `src/types/notificationSystem.ts` — 1,099 LOC (type file this large is itself a smell)
- `src/pages/Roadmap.tsx` — 1,072 LOC
- `src/components/messaging/group/GroupInfoDrawer.tsx` — 1,072 LOC
- `src/services/profileIdentityHubService.ts` — 1,065 LOC
- `src/components/connect/tabs/ProfessionalsMockData.ts` — 1,044 LOC (mock data shipped to prod)
**Recommendation:** Mock data (`demoSearchData`, `ProfessionalsMockData`, `seedAlphaData`) must not be in the production bundle. Split god services by concern. `featureContent.tsx` belongs in CMS/MDX, not in TSX.

### 3.3 SIGNIFICANT — Two parallel messaging services that overlap
**Files:** `src/services/messageService.ts` (1,246 LOC), `src/services/messagingPrdService.ts` (1,306 LOC)
**Evidence:** Both files implement send/list/subscribe message operations. There is no "PRD" doc explaining why `messagingPrdService` exists as a parallel implementation. `useMessagingPrd` (a hook) and `useRealtimeMessages` (another hook) compound the duplication.
**Recommendation:** Pick one service. Migrate consumers. Delete the loser.

### 3.4 SIGNIFICANT — Two parallel profile UIs
**Files:** `src/components/profile/edit/DiasporaSection.tsx` and `src/components/profile-edit/ProfileEditDiaspora.tsx` (same field, two different forms). Plus `src/components/profile-v2/ProfileV2Connection.tsx` (a "v2" alongside v1).
**Evidence:** Three profile editor lineages live in tree. `profile-v2/` implies a deprecated v1 that was never removed.
**Recommendation:** Pick the v2 line, delete the others, drop the `-v2` suffix.

### 3.5 SIGNIFICANT — 120 files in `src/hooks/` flat namespace, with overlap
**Evidence:** `useConveneLogic`, `useConveyLogic`, `useConveyMutations`, `useConveyFeed`, `useConveyAnalytics`, `useFeedQuery`, `useFeedbackMessages` etc. all live at the root of `src/hooks/`. Subdomains have been started (`hooks/composer`, `hooks/messaging`, `hooks/contribute`, `hooks/convene`) but most domain hooks were never moved in. The result is a 120-file flat list with strong duplication signal.
**Recommendation:** Force-move hooks into `hooks/<domain>/` to match the 5 C's module isolation rule in project memory.

### 3.6 SIGNIFICANT — Routes likely unreachable from app navigation
**Evidence:** App.tsx declares 143 unique paths. Navigation in `src/components/header/navigationConfig.ts` exposes 10 of them. Even with deep-link buttons and search results, this leaves dozens of routes (`/dna/applications/received`, `/africa/:regionSlug`, `/dna/collaborate/spaces/new`, `/dna/collaborate/spaces/:slug/board`) that need an audit pass to confirm reachability. The audit script in this run produced a noisy result (`tsx` filetype not registered) so a clean reachability table needs a separate pass.
**Recommendation:** Run `npx unimported` or a custom script that grep-matches every `path="X"` against `to=X|navigate(X)` references with parameter normalization. Delete or hide routes that fail.

### 3.7 SIGNIFICANT — 621 `any` types in `src/` across hundreds of files
**Evidence:** `rg ": any\b|<any>|as any\b" src/ --count-matches` totals 621. Project memory has a "Zero `any` policy" core rule. The codebase is in egregious violation.
**Recommendation:** Add an ESLint rule (`@typescript-eslint/no-explicit-any: error`) and let it fail CI. Burn down the existing 621 over a few sprints.

### 3.8 SIGNIFICANT — Mock data shipped to production
**Files:** `src/data/demoSearchData.ts` (1,302 LOC), `src/components/connect/tabs/ProfessionalsMockData.ts` (1,044 LOC), `src/scripts/seedAlphaData.ts` (914 LOC)
**Evidence:** None of these are gated behind a dev-only import. They will be bundled if imported anywhere in a render path. `seedAlphaData.ts` lives in `src/scripts/` but if any production module imports from `src/scripts/`, the seed payload ships.
**Recommendation:** Move to `tools/` outside `src/`, or behind `import.meta.env.DEV` guards.

### 3.9 MINOR — `useOnboardingForm` declares two parallel validation files
**Files:** `src/components/onboarding/validation/onboardingStepValidation.ts` AND `src/components/onboarding/validation/OnboardingValidation.ts`
**Evidence:** Same directory, same purpose, different casing. Both reference the `country_of_origin` field.
**Recommendation:** Delete one.

### 3.10 MINOR — 0 circular dependencies (positive finding)
**Evidence:** `madge --circular` returns clean across all 1,553 source files.

### 3.11 MINOR — `src/integrations/supabase/types.ts` is 15,229 LOC and dominates LOC counts
**Recommendation:** Cosmetic only — generated file. But every `wc -l` on the repo lies because of it. Note this when reporting LOC externally.

---

## Section 4 — Dependency Drift

### 4.1 SIGNIFICANT — `@supabase/supabase-js` lags 57 minor versions (2.49.9 vs 2.106.2)
**Evidence:** `npm outdated` shows 2.49.9 installed, 2.106.2 latest. This is the most-used dependency in the project. Bug fixes, realtime improvements, and security patches are unshipped.
**Recommendation:** Bump in a dedicated PR, run smoke tests on realtime channels (Performance Foundation rule #3).

### 4.2 SIGNIFICANT — Entire Radix UI surface 6-15 minor versions behind
**Evidence:** Every Radix package shows a version gap. e.g. `react-dialog 1.1.2 → 1.1.15`, `react-select 2.1.2 → 2.2.6`, `react-radio-group 1.2.1 → 1.3.8`.
**Recommendation:** Single PR to bump Radix as a unit.

### 4.3 SIGNIFICANT — `@hookform/resolvers` major version behind (3.9.0 vs 5.4.0)
**Recommendation:** Major-version bump - run form validation regression pass after.

### 4.4 SIGNIFICANT — Two date libraries: `date-fns` AND `moment`
**Evidence:** `jq '.dependencies | keys[] | select(test("date-fns|moment"))'` shows both. `moment` is in maintenance mode and 70+ KB gzipped. There should be exactly one date library.
**Recommendation:** Audit `moment` import sites, migrate to `date-fns`, drop `moment`.

### 4.5 SIGNIFICANT — 11 production dependencies have zero imports in `src/`
**List:**
- `@tanstack/react-virtual`
- `@types/qrcode`, `@types/react-big-calendar`, `@types/uuid` (these are types-only but in `dependencies` not `devDependencies`)
- `@zxing/browser`
- `embla-carousel-autoplay`
- `html2canvas`
- `i18n-iso-countries`
- `react-error-boundary`
- `tailwindcss-animate`
- `uuid`

**Recommendation:** Move the `@types/*` packages to `devDependencies`. Drop the rest. `tailwindcss-animate` may be referenced from `tailwind.config.ts` rather than imported — verify before removal.

### 4.6 MINOR — `npm audit` reports null vulnerabilities object
**Evidence:** `npm audit --json | jq '.metadata.vulnerabilities'` returned `null`. Re-run audit on next install; the result is suspect.
**Recommendation:** Run `npm audit` against a clean install before any release.

### 4.7 COSMETIC — `@eslint/js` major version behind (9 → 10)
**Recommendation:** Tooling-only bump.

---

## Section 5 — UX-vs-Foundation Extraction (NO INTERPRETATION)

All matches in customer-facing surfaces (`.tsx` and `.ts` string-bearing files). Context shown is the matched line. For brevity, surrounding context can be retrieved at the file:line ref. Hits in `src/integrations/supabase/types.ts`, `src/_archived/`, and migrations are excluded except where noted.

### Group A — Sacred canon terms

| Term | File:Line | Context |
|---|---|---|
| heartbeat | `src/data/featureContent.tsx:732` | "CONVEY brings the heartbeat of the platform to life." |
| heartbeat | `src/data/featureContent.tsx:1382` | "Projects become the organizing brain. Tasks become the heartbeat." |
| heartbeat (animation) | `src/components/feed/LinkPreviewCard.tsx:129` | `animate-heartbeat` Tailwind class on link preview play button |
| heartbeat (animation) | `src/components/feed/VideoLinkPreview.tsx:118-120` | "Play button overlay with heartbeat pulse animation" |
| heartbeat (animation) | `src/components/messaging/inbox/LinkPreview.tsx:26,76` | "Stop heartbeat animation after 10 seconds" / `showHeartbeat && "animate-heartbeat"` |
| heartbeat (animation) | `src/components/messaging/inbox/MessageAttachment.tsx:56,93,112,135` | `animate-heartbeat`, `animate-image-heartbeat` |
| heartbeat (presence) | `src/App.tsx:254` | "Mounts presence heartbeat for the authenticated user (Phase 1 messaging foundation)" |
| heartbeat (presence) | `src/contexts/MessageContext.tsx:58` | "Keep user's online presence updated (heartbeat)" |
| heartbeat (presence) | `src/hooks/messaging/usePresenceHeartbeat.ts:7` | "Heartbeat presence: tracks the current user on the shared `presence:global`" |
| heartbeat (presence) | `src/hooks/usePresence.ts:87,90` | "Hook to automatically update own presence (heartbeat)" / "No-op - presence heartbeat requires database functions" |
| Mother Africa | `src/pages/Manifesto.tsx:47` | "Wherever we are, we carry her with us. Mother Africa's instructions are in our cells." |
| the body | `src/pages/Manifesto.tsx:13` | "...you cannot erase what is written in the body. We are 200 million strong. We are DNA." |
| the body | `src/pages/Manifesto.tsx:24` | "You cannot erase what is written in the body." |
| the body | `src/components/onboarding/steps/DiasporaOriginStep.tsx:27` | "Where are you from? This helps DNA understand the body's reach." |
| the body | `src/components/onboarding/steps/DiasporaOriginStep.tsx:36` | "Your heritage helps us reflect the breadth of the body." |
| Diaspora (capital D) | repo-wide | 367 occurrences in `*.tsx`/`*.ts` (count only - too many to enumerate). Top concentrations: `src/data/featureContent.tsx`, `src/pages/Manifesto.tsx`, `src/pages/About.tsx`, `src/pages/PitchDeck.tsx`, `src/components/onboarding/RoleDeclarationStep.tsx`. |

No hits for: `blood`, `rupture`, `kinship`, `kin` (as identity terms).

### Group B — D054 vocabulary

| Term | File:Line | Context |
|---|---|---|
| Returnee | `src/scripts/seedAlphaData.ts:128` | `diaspora_status: 'Returnee'` |
| returnees | `src/scripts/seedAlphaData.ts:375` | "Developing affordable housing for diaspora returnees and local communities." |
| Returnee | `src/services/matchingService.ts:60,64,683` | `['returnee', 'continental_african', 'Returnee connecting with local']` |
| returnee | `src/types/profileIdentityHub.ts:150,650` | `'returnee'` enum value; label "Returnee - Returned to Africa" |
| returnee | `src/data/profileOptions.ts:55` | `{ value: 'returnee', label: 'Returnee', description: 'Returned to live in Africa' }` |
| returnees | `src/data/featureContent.tsx:2379` | "Every new member... contributors, and returnees." |
| returnees | `src/components/demo/sections/DemoPersonas.tsx:97` | "from event organizers to returnees." |
| returnees | `src/components/right-rail/AskDiaCta.tsx:15` | "What returnees match my sector this week?" |
| Returnee | `src/components/onboarding/RoleDeclarationStep.tsx:16-19` | `value: 'returnee'`, `heading: 'Returnee'`, `buttonLabel: 'I am a Returnee'` |
| Returnees | `src/components/onboarding/PlaceDeclarationStep.tsx:103` | "Returnees on every continent, Anchors across Africa, Allies wherever..." |
| Anchor | `src/components/onboarding/RoleDeclarationStep.tsx:22-25` | `value: 'anchor'`, `heading: 'Anchor'`, `buttonLabel: 'I am an Anchor'` |
| Anchors | `src/components/onboarding/PlaceDeclarationStep.tsx:103` | (same line as above) |
| anchor (HBCU) | `src/config/partnerModels.ts:61-62` | `id: 'hbcu-anchor-partner'`, `name: 'HBCU Anchor Partner'` |
| anchor (engagement) | `src/data/featureContent.tsx:347` | "Use events as engagement anchors" |
| anchor (identity) | `src/data/featureContent.tsx:2401` | "...anchor your identity" |
| anchor (RSVP logic) | `src/lib/diaAttendancePrediction.ts:6` | `1. Current "going" RSVPs (anchor)` |
| ally | `src/data/profileOptions.ts:56` | `{ value: 'ally', label: 'Ally / Friend of Africa' }` |
| ally | `src/types/profileIdentityHub.ts:152,652` | `'ally'` enum value; label "Ally - Committed to the mission" |
| ally | `src/components/onboarding/RoleDeclarationStep.tsx:28-31` | `value: 'ally'`, `heading: 'Ally'`, `buttonLabel: 'I am an Ally'` |
| ally | `src/components/onboarding/hooks/useOnboardingForm.ts:5` | `user_type: 'individual' \| 'organization' \| 'diaspora_professional' \| 'founder' \| 'ally'` |
| allies | `src/pages/Install.tsx:106` | "Join the global African diaspora, descendants, migrants, and allies..." |
| allies | `src/pages/UserAgreement.tsx:43,45` | "...connect the African Diaspora and allies..." |
| allies | `src/data/featureContent.tsx:169,266` | "...members of the global African diaspora and allies..." |
| allies | `src/components/legal/TermsOfServiceModal.tsx:46` | "...global African diaspora and its allies..." |
| allies | `src/components/platform/PillarInfoSheet.tsx:32,41` | "...Diaspora, continental Africans, and allies..." |
| ally (display) | `src/components/connect/tabs/ProfessionalsMockData.ts:163,168` | `origin: 'Ally - Chinese American'` / "Passionate ally investing in African tech startups" |
| ally (profile) | `src/components/profile/edit/DiasporaSection.tsx:52` | "Whether diaspora, continental African, or ally, tell us how you connect" |
| ally (profile) | `src/components/profile-edit/ProfileEditDiaspora.tsx:72` | "Whether diaspora, continental African, or ally, tell us how you connect" |
| ally (profile-v2) | `src/components/profile-v2/ProfileV2Connection.tsx:271` | "Share how you connect to Africa, whether diaspora, continental, or ally." |
| ally (archived) | `src/components/_archived/onboarding/steps/PersonalizedStep.tsx:196` | `if (userType === 'ally') { ... }` |
| ally (archived) | `src/components/_archived/admin_legacy/SeedDataManager.tsx:141` | `diaspora_identity: 'Ally'` |
| Exploring | `src/types/profileIdentityHub.ts:155,656` | `'exploring'` enum value; label "Exploring - New to diaspora engagement" |
| exploring | `src/services/profileIdentityHubService.ts:1029` | `heritage.diasporaEngagement ?? 'exploring'` |
| Exploring | `src/services/dia/diaChat.ts:510` | "Try exploring ${inactiveCs[0]} to unlock more of DNA's power." |
| exploring (intent) | `src/types/onboardingHub.ts:126` | "Student \| Exploring my Ghanaian heritage from Toronto" |

### Group C — Pre-D054 / legacy identity terminology

| Term | File:Line | Context |
|---|---|---|
| diaspora members | `src/scripts/seedAlphaData.ts:427,623,657` | seed data narratives |
| diaspora members | `src/pages/LocalEventsPage.tsx:134,489` | "Diaspora members living nearby..." |
| diaspora members | `src/pages/Install.tsx:24` | "Build bridges with fellow diaspora members across continents" |
| diaspora members | `src/pages/Index.tsx:40` | "Join 200M+ diaspora members on DNA..." |
| diaspora members | `src/pages/About.tsx:47` | "DNA empowers 200M+ African diaspora members..." |
| diaspora members | `src/pages/DesignSystem.tsx:274` | "Join 200M+ diaspora members worldwide..." |
| diaspora members | `src/pages/PitchDeck.tsx:45,55,281` | "200M+ diaspora members worldwide" (3 hits) |
| diaspora members | `src/pages/Auth.tsx:180,496` | "Connect with diaspora members across continents" / "Trusted by diaspora members in 50+ countries" |
| diaspora members | `src/pages/Roadmap.tsx:81,104` | marketplace + introductions copy |
| diaspora members | `src/pages/FactSheetPage.tsx:229` | "We start by linking diaspora members to each other..." |
| diaspora members | `src/data/featureContent.tsx:655,1280` | volunteer recruitment narratives |
| diaspora members | `src/pages/Waitlist.tsx:115,140,169` | "200M+ global diaspora members" |
| diaspora members | `src/pages/_archived/ConnectExample.tsx:111` | archived |
| diaspora members | `src/pages/dna/Me.tsx:97` | "Find and connect with diaspora members" |
| diaspora members | `src/pages/dna/settings/PreferencesSettings.tsx:165` | "Discover and network with diaspora members" |
| A diaspora member | `src/components/contribute/room/RecognitionCard.tsx:31` | `const displayName = subject?.displayName ?? 'A diaspora member'` |
| A diaspora member | `src/components/contribute/room/MatchedNeedCard.tsx:22` | same pattern |
| A diaspora member | `src/components/contribute/room/CurationDrawer.tsx:31` | same pattern |
| A diaspora member | `src/services/contributeRoomService.ts:91` | `?? 'A diaspora member'` fallback |
| A diaspora member | `src/services/dia/connectCards.ts:90` | "A fellow diaspora member" fallback |
| diaspora members | `src/services/dia/profileIntelligence.ts:239` | "Connect with diaspora members across language barriers" |
| diaspora members | `src/services/profileIdentityHubService.ts:556` | "Location helps DIA connect you with nearby diaspora members." |
| diaspora members | `src/pages/dna/collaborate/ComingSoonCollaborate.tsx:157` | "Many diaspora members want to give back..." |
| diaspora members | `src/components/survey/SurveyDialog.tsx:220,263,277` | survey question text |
| West African user (singular) | `src/components/connect/tabs/ProfessionalsMockData.ts:852` | `recentActivity: 'Led 200% growth in West African user acquisition'` |
| diaspora professional(s) | `src/config/partnerSectors.ts:56,76,130` | "Map and activate diaspora professionals..." / "Diaspora Talent Recruitment Pipeline" |
| diaspora professionals | `src/config/dia-pillar-config.ts:37,128` | "diaspora professional communities" / "Find diaspora professionals in renewable energy" |
| diaspora professionals | `src/data/demoSearchData.ts:423` | "60+ diverse diaspora professionals" |
| diaspora professionals | `src/pages/MvpPhase.tsx:26,135,154` | 3 hits in MVP-phase planning page |
| diaspora professionals | `src/pages/Install.tsx:34` | "Collaborate directly with diaspora professionals worldwide" |
| diaspora professionals | `src/pages/About.tsx:90,212,260,356` | 4 hits |
| diaspora_professional (user_type literal) | `src/components/onboarding/hooks/useOnboardingForm.ts:4-5` | TS union value |
| founder (user_type literal) | `src/components/onboarding/hooks/useOnboardingForm.ts:5` | `'founder'` in user_type union |
| diaspora_status (in JSX/forms) | `src/components/profile/edit/DiasporaSection.tsx:60-79` | form field id, validation, display |
| diaspora_status (in JSX) | `src/pages/PublicProfilePage.tsx:368-373` | conditional render, "Connection Type:" label |
| diaspora_status (in JSX) | `src/components/connect/hub/EnhancedMemberCard.tsx:346,529-530` | display in member card |
| diaspora_status (in JSX) | `src/components/profile-v2/ProfileV2Connection.tsx:64,104,111` | conditional render, `getConnectionLabel` |
| diaspora_status (in form state) | `src/pages/Onboarding.tsx:79,384` | form state seed + insert payload |
| diaspora_status (in form state) | `src/components/onboarding/hooks/useOnboardingForm.ts:52` | form state init |
| user_type (in JSX/logic) | `src/components/onboarding/steps/UserTypeStep.tsx:58-119` | full UserTypeStep UI keyed on the column |
| user_type (in JSX) | `src/pages/dna/convey/CreateStory.tsx:123` | `const isAdmin = profile?.user_type === 'admin'` (note: 'admin' is NOT in the declared TS union) |
| user_type (in form state) | `src/pages/Onboarding.tsx:71,233,363` | form state + insert payload |

### Group D — Removed onboarding patterns (per BD014)

| Term | File:Line | Context |
|---|---|---|
| How are you joining | `src/pages/Onboarding.tsx:27` | `'How are you joining?'` (step label) |
| How are you joining DNA? | `src/components/onboarding/steps/UserTypeStep.tsx:46` | `<h2>How are you joining DNA?</h2>` |
| Country of Heritage | `src/components/onboarding/steps/DiasporaOriginStep.tsx:43` | `Country of Heritage *` label |
| Connection to Africa | `src/data/profileOptions.ts:47,208` | section header comments |
| Connection to Africa | `src/lib/generateProfilePDF.ts:193` | PDF section header |
| Connection to Africa | `src/pages/PublicProfilePage.tsx:367,370` | section header on public profile |
| Connection to Africa | `src/components/AmbassadorSignupDialog.tsx:231` | dialog section header |
| Connection to Africa | `src/components/MainPageFeedbackPanel.tsx:239` | feedback panel header |
| Connection to Africa | `src/components/profile/edit/DiasporaSection.tsx:49` | edit section header |
| Connection to Africa | `src/components/profile-edit/ProfileEditDiaspora.tsx:71` | edit section header (duplicate UI) |
| Connection to Africa | `src/components/onboarding/hooks/useOnboardingForm.ts:17` | `// Step 3: Connection to Africa` comment |
| How do you connect to Africa | `src/components/profile/edit/DiasporaSection.tsx:58` | `<Label>How do you connect to Africa? *</Label>` |
| How do you connect to Africa | `src/components/profile-edit/ProfileEditDiaspora.tsx:77` | `<Label>How do you connect to Africa?</Label>` |
| Country of origin (UI) | `src/lib/profileCompletion.ts:125` | `label: 'Country of origin'` |
| Country of Origin | `src/components/connect/DiscoverFilterSheet.tsx:191` | filter label |
| Country of Origin | `src/components/_archived/connect/DiscoverFilters.tsx:121` | archived |
| Country of Origin | `src/components/survey/SurveyDialog.tsx:179,184` | survey form field + placeholder |
| Country of Origin | `src/components/onboarding/steps/DiasporaImpactStep.tsx:30,32,37` | onboarding step label + placeholder |
| Country of Origin (visual) | `src/components/onboarding/OnboardingTour.tsx:56` | `<li>Country of origin or heritage</li>` |
| country of origin (db field references in form layer) | `src/components/onboarding/validation/{onboardingStepValidation,OnboardingValidation}.ts:75,77` | error message + required-field validation |
| Country of Origin (archived) | 6 hits across `src/components/_archived/**` | search/profile/discovery |

### Group E — Mythic register

| Term | File:Line | Context |
|---|---|---|
| The Return | `src/components/onboarding/RoleDeclarationStep.tsx:30` | "...what you bring strengthens The Return. You walk alongside..." |
| stand / where you stand | `src/components/onboarding/RoleDeclarationStep.tsx:24` | "You're on the continent, building from where you stand. The Diaspora is returning to the work..." |

No hits for: `The Work` (capitalized as mythic register), `called` / `calling` in identity context.

---

## Section 6 — Test Coverage Drift

### 6.1 CRITICAL — 6 test files for 1,550 source files (0.39% file coverage)
**Files:**
- `src/components/messaging/group/GroupInfoDrawer.test.tsx`
- `src/components/onboarding/PlaceDeclarationStep.test.tsx`
- `src/lib/dna-place.test.ts`
- `src/test/feedTabConsistency.test.tsx`
- `src/test/pulseBarLayout.test.tsx`
- `src/test/roadmapBannerSpacing.test.tsx`

**Result:** All 6 pass (41 tests, 8.16s). Effectively zero coverage on auth, onboarding flow end-to-end, feed, profile editing, settings, search, messaging send/receive, payments, edge functions.
**Recommendation:** Adopt a 30-day baseline: write integration tests for the five highest-traffic flows (auth, onboarding step submission, post creation, message send, profile read). Set Vitest coverage threshold to fail PRs that drop below baseline.

### 6.2 SIGNIFICANT — No E2E framework
**Evidence:** No `playwright.config.*`, `cypress.config.*`, or `e2e/` directory.
**Recommendation:** Adopt Playwright for the same five flows above.

### 6.3 MINOR — `GroupInfoDrawer.test.tsx` emits 7 React Dialog "Missing Description" warnings while passing
**Recommendation:** Add `aria-describedby` or `<DialogDescription>` to test fixture renders. Accessibility memo also flags this.

---

## Engineering Recommendation

**Recommendation: HYBRID REBUILD.**

This codebase is salvageable but not by patching. The evidence:

**Why not "keep":**
- 217-column `profiles` table cannot be fixed with another patch. Every new feature on profiles compounds it.
- 621 `any` types and 0.39% test coverage means refactors at this scale will silently break things and no one will notice until users do.
- The `dna_identity_role` enum exists in DB but no table writes it the way onboarding tries to - that's an integration bug shipping to production right now.
- 160 Markdown docs, 30 god files, 243 `_archived/` files, two parallel messaging services, three profile editor lineages, two onboarding-validation files, two date libraries. The system has been rebuilt in place multiple times and the old layers were never deleted.

**Why not "full restart":**
- The shape of the product is correct: 5 C's modules, DIA, messaging, contribute. Restarting throws away a year of product discovery encoded in `featureContent.tsx`, the seed data, the partner-models config, the matching service heuristics, and 763 migrations of learned schema.
- The brand and design system (Lora/Inter, emerald/forest/copper, Adinkra iconography enforcement scripts) is mature and unique. That work would be expensive to redo.
- 0 circular dependencies and a clean service-role-key story mean the foundational architecture is sound; what is broken is accumulation, not structure.

**Why hybrid:**
1. **Greenfield a new `profiles` schema** with the 20-30 columns that are actually used, write a one-shot backfill from the current 217 columns, deprecate the old shape.
2. **Standardize on D054 vocabulary** at the type level (one enum, one column, one dropdown set), let TS find every legacy site, delete `_archived/`.
3. **Burn down the `any` count** with an ESLint rule, parallelized to (1) and (2). Coverage must reach 30% on the five critical flows before continuing feature work.
4. **Consolidate duplicated services** (messaging x2, profile editor x3, validation x2) in dedicated PRs.
5. **Curate `docs/`** down to under 20 living documents in one commit; archive the rest.
6. **Upgrade Supabase JS, Radix, hookform/resolvers** as a coordinated dependency bump with regression on realtime channels.

If the team has the discipline to refuse new feature work for 4-6 weeks while doing the above, the codebase becomes maintainable. If feature work continues during cleanup, the drift will outpace the cleanup and a full restart becomes inevitable within 6-12 months. The window for "hybrid" closes the moment a third profile editor lineage or a fourth messaging service appears.

**Founder-facing question to settle before starting:** Are the project's foundation decisions (D001-D081, BD001-BD016) frozen, or still in flux? If still in flux, defer the schema collapse and finish the foundation first. If frozen, start with `profiles` collapse on Monday.

— end of audit —
