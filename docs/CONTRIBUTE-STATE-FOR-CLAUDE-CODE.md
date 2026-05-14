# CONTRIBUTE Module — Current Build State

**For:** Claude Code handoff
**As of:** 2026-05-14
**Status:** Phases 1-3 shipped. Phase 4 (fulfillment loop + Room polish + DIA reasoning swap) outstanding.

---

## 1. Mental Model (canonical)

CONTRIBUTE is built as a three-layer "currency circulation" system, NOT a marketplace:

1. **The Manifest** — what a member offers (Phase 1)
2. **The Need** — what a member is looking for (Phase 2)
3. **The Room** — daily curated matches between viewer's manifest/needs and other members' manifests/needs (Phase 3)

Currencies: `expertise | network | resources | capital`. `capital` is **deferred v1** (DB constraint `capital_deferred_v1` blocks authoring; UI shows `CapitalComingSoonCard`).

There is also a **legacy "needs/offers" surface** (`contribution_needs`, `contribution_offers`, `contribution_fulfillments`) used by the older Opportunities/Marketplace flow. This is partially stubbed (`src/pages/Opportunities.tsx` and `OpportunityDetail.tsx` are `RebuildingDetailPlaceholder`s) but the tables and `FulfillmentTracker` component are still wired. Decision needed in Phase 4: collapse legacy into Manifest/Need/Room, or keep as a parallel "fulfillment ledger" backing Recognition.

---

## 2. Database (Supabase, public schema)

### Phase 1-3 canonical tables
| Table | Cols | Purpose |
|---|---|---|
| `contribution_manifests` | 7 | One per user. Headline + publish state. |
| `currency_stances` | 14 | Up to 5 stances per manifest. `capital_deferred_v1` CHECK forbids capital authoring. |
| `need_declarations` | 17 | Active needs (cap = 10 enforced by `enforce_active_need_declaration_cap` trigger). Status: draft/open/matched/fulfilled/closed/expired. |
| `room_curations` | 15 | Daily curation rows per viewer. Score 0-1; UI cutoff = 0.5 (`ROOM_SCORE_CUTOFF`). `kind`: their_stance_my_need / their_need_my_stance / mutual / tag_affinity. `reasoning_source`: `sql` or `dia`. |

### Legacy / parallel tables
| Table | Cols | Status |
|---|---|---|
| `contribution_needs` | 17 | Legacy marketplace needs. UI stubbed. |
| `contribution_offers` | 10 | Legacy offer flow. |
| `contribution_fulfillments` | 12 | Backs `FulfillmentTracker`. Live. |
| `contribution_acknowledgments` | 8 | Recognition data. |
| `verified_contributors` | 6 | Used by `handle_contributor_approval`. |
| `contribution_cards` | — | DIA card surfacing. |
| `project_contributions`, `opportunity_contributions` | — | Cross-module footprint counters. |

### RPCs (Supabase functions)
- **Manifest:** `ensure_manifest`, `get_manifest_for_user`, `publish_manifest`
- **Stances:** `enforce_active_stance_cap` (trigger)
- **Needs:** `publish_need_declaration`, `close_need_declaration`, `get_need_declarations_for_user`, `enforce_active_need_declaration_cap`, `stamp_need_declaration_lifecycle`, `log_need_event`, `delete_need_posts`
- **Room:** `get_room_for_viewer`, `get_room_readiness`, `curate_room_for_user`, `dismiss_curation`
- **Other:** `get_profile_contribution_history`, `update_profile_contributions`, `handle_contributor_approval`, `get_users_needing_connection_nudges`

All RLS policies enforced. Per-user data only via `auth.uid()`.

---

## 3. Frontend Layout

### Routes (`src/App.tsx`)
```
/dna/contribute                     -> ContributeHub          (canonical landing)
/dna/contribute/manifest            -> ManifestEditorPage
/dna/contribute/my-needs            -> NeedComposerPage
/dna/contribute/needs               -> NeedsIndex
/dna/contribute/needs/:id           -> NeedDetail
/dna/contribute/my                  -> MyContributions
/dna/contribute/fulfillment/:id     -> FulfillmentTracker
/dna/contribute/impact              -> ImpactDashboard
/dna/contribute/:id                 -> OpportunityDetail (stubbed)
/dna/impact, /dna/impact/:id        -> redirect to /dna/contribute
```

### Pages
- `pages/dna/contribute/ContributeHub.tsx` — **canonical hub.** Mobile header (`ContributeMobileHeader`) with 4 tabs (manifest / room-via-needs / mine / impact). Renders `ManifestRenderer` + `RoomHub` + `NeedEditor` stacked.
- `ContributeDiscovery.tsx` — discovery lane (probably orphaned now that hub renders inline; verify before deleting).
- `ManifestEditorPage`, `NeedComposerPage`, `NeedsIndex`, `NeedDetail`, `MyContributions`, `ImpactDashboard` — supporting pages.
- `Opportunities.tsx`, `OpportunityDetail.tsx` (root `pages/`) — **stubbed** as `RebuildingDetailPlaceholder`. Restore or delete in Phase 4.

### Components (`src/components/contribute/`)
- `manifest/`
  - `ManifestEditor.tsx`, `ManifestRenderer.tsx`, `ManifestPublishGate.tsx`
  - `HeadlineEditor.tsx` (60-280 chars, soft min 60)
  - `CurrencyStanceCard.tsx`, `CurrencyStanceForm.tsx`
  - `CapitalComingSoonCard.tsx`
  - `currencyConfig.ts` (icons/labels/colors per currency)
- `needs/`
  - `NeedEditor.tsx`, `NeedComposer.tsx`, `NeedCard.tsx`, `NeedsRenderer.tsx`
  - `needsConfig.ts`
- `room/`
  - `RoomHub.tsx` — orchestrator; reads `useRoom()` + `useRoomReadiness()`
  - `MatchedNeedsZone.tsx` + `MatchedNeedCard.tsx` — needs-side matches
  - `PeopleZone.tsx` — stance-side matches
  - `RecognitionCard.tsx` — fulfillment recognition
  - `CurationDrawer.tsx` — full reasoning + actions per match
  - `RoomReasoningLine.tsx` — inline reasoning
  - `RoomEmptyStates.tsx` — onboarding nudges by readiness state
- `ContributeDIADiscoveryCard.tsx` — DIA card surfacing
- `ContributeMobileHeader.tsx` — mobile chrome (matches Feed/Connect/Convene pattern)
- `FulfillmentTracker.tsx` — legacy fulfillment lifecycle UI (still routed)

### Hooks (`src/hooks/contribute/`)
- `useManifest.ts` — own manifest + others' manifests via RPC
- `useStances.ts` — CRUD with cap enforcement
- `useNeeds.ts` — `useOwnNeeds`, `useUserNeeds`, `useNeedMutations` (create/update/publish/close/delete)
- `useRoom.ts` — `useRoom` (filters score >= 0.5), `useRoomReadiness`, `useRoomSubjects` (batch profile fetch). dayBucket cache key prevents stale rooms.
- `useDismissCuration.ts` — soft-dismiss a curation row

### Services (`src/services/`)
- `contributeManifestService.ts` — manifest + stance CRUD
- `contributeNeedService.ts` — need CRUD + publish/close RPCs, status sort order
- `contributeRoomService.ts` — Room reads, subject profile batch, readiness

### Types (`src/types/`)
- `contribute.ts` — **canonical** Phase 1-3 types: `ContributionManifest`, `CurrencyStance`, `NeedDeclaration`, `RoomCuration`, `RoomReadiness`, `RoomSubjectProfile`, all enums + form constants (caps, soft warns, score cutoff)
- `contributeTypes.ts` — **legacy** `ContributionNeed`, `ContributionOffer`, `ContributionBadge`, `ContributeStats`
- `contributionTypes.ts` — cross-module footprint counter type

---

## 4. Key Constants & Rules (encoded in `src/types/contribute.ts`)

```
STANCE_TITLE_MIN = 4, MAX = 120
STANCE_DESCRIPTION_MAX = 600
STANCE_TAGS_MAX = 8
HEADLINE_SOFT_MIN = 60, HARD_MAX = 280
MANIFEST_STANCE_CAP = 5, SOFT_WARN = 3
NEED_TITLE_MIN = 4, MAX = 120
NEED_CONTEXT_MAX = 1000
NEED_TAGS_MAX = 8
NEED_ACTIVE_CAP = 10, SOFT_WARN = 5
ROOM_SCORE_CUTOFF = 0.5  // client-side gate
AUTHORABLE_CURRENCIES = ['expertise','network','resources']  // capital deferred
```

Match kinds: `their_stance_my_need | their_need_my_stance | mutual | tag_affinity`
Reasoning source: `sql | dia` (currently SQL only — DIA reasoning not wired)

---

## 5. What Works End-to-End ✅
1. Author manifest + stances (capped at 5, capital blocked).
2. Publish manifest.
3. Declare needs (capped at 10 active).
4. Publish/close needs via RPC with lifecycle stamping + event log.
5. Daily Room curation via `curate_room_for_user`, scored, gated client-side at 0.5.
6. Subject profile batch fetch, drawer view, dismiss action.
7. Readiness onboarding empty states.
8. Mobile-first chrome consistent with Feed/Connect/Convene.
9. Legacy `FulfillmentTracker` flow live for projects already using it.

## 6. What Is NOT Done ❌ (Phase 4 candidates)
1. **DIA reasoning swap** — `reasoning_source='dia'` exists in schema but no producer; only SQL reasoning runs.
2. **Match action loop** — clicking a match opens `CurationDrawer` but does not yet auto-create a messaging thread or convert into a fulfillment record.
3. **Fulfillment ↔ Manifest/Need bridge** — legacy `contribution_fulfillments` is not joined to new `need_declarations`. Recognition card pulls from legacy data only.
4. **Recognition + acknowledgments** — `contribution_acknowledgments` table exists but no UI to give/receive recognition tied to a Room match.
5. **Capital v2** — currency exists in enum, blocked from authoring. Future: separate compliance flow.
6. **Opportunities page rebuild** — `/dna/contribute/:id` and root `Opportunities.tsx` still placeholder.
7. **Discovery lane reconciliation** — `ContributeDiscovery.tsx` likely orphaned now that `ContributeHub` renders Room inline. Confirm + delete.
8. **Cross-module footprint** — `project_contributions` / `opportunity_contributions` write paths: verify which surfaces still write here.
9. **Connection nudges** — `get_users_needing_connection_nudges` RPC exists; no scheduled job calling it for Contribute (only Connect uses similar pattern).
10. **Tests** — no contribute-specific tests in `src/test/`.

## 7. Open Decisions for Claude Code
1. **Legacy collapse vs. coexist?** Should `contribution_needs/offers/fulfillments` be migrated into `need_declarations` + a new `need_fulfillments` table, or kept as the "transactional ledger" under Manifest/Need? (Recommend collapse; legacy has 0 production usage outside FulfillmentTracker.)
2. **DIA reasoning producer** — edge function or in-RPC LLM call? Pattern should mirror `dia-smart-compose` edge function.
3. **Action on match accept** — auto-thread (call `create_introduction` style RPC) or explicit user click → composer? Aligns with Connect introduction workflow standard.
4. **Recognition trigger** — mutual confirm? Single-side mark fulfilled? Time-decay?
5. **Opportunities rebuild** — kill route entirely, or repurpose `/dna/contribute/:id` as canonical NeedDetail (already exists at `/needs/:id` — duplicate)?

## 8. Memory / doctrine reminders
- Five C's icon: **Adinkrahene** (Contribute). Never substitute lucide.
- Currency colors must come from semantic tokens (no hard-coded hex).
- Realtime channels on contribute tables MUST include `filter` (per the Performance Foundation 5 rules) — check `useRoom`/`useNeeds` if/when realtime is added.
- Em-dashes forbidden.

---

**TL;DR for Claude Code:** Phase 1-3 (Manifest, Need, Room) are live and stable. Phase 4 = wire DIA reasoning into `room_curations.reasoning_source='dia'`, build the match→message→fulfillment→recognition loop, decide legacy table fate, and rebuild Opportunities or delete it.
