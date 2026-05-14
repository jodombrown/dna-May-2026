# Contribute Phase 4 — Deliverable 1 verification: BLOCKED

Per the sprint's hard rule ("If any verification fails, stop and report. Do not proceed"), I ran the read-only verification and stopped. Two blockers, both require your decision before I touch a single UI file.

---

## Blocker 1 — Migration `20260514_contribute_phase4.sql` is NOT applied

Live DB shows:

| Object | Expected | Found |
|---|---|---|
| table `need_fulfillments` | exists | **missing** |
| RPC `offer_fulfillment` | callable | **missing** |
| RPC `confirm_fulfillment` | callable | **missing** |
| trigger fn `issue_mutual_asante_on_confirm` | exists | **missing** |
| `room_curations.engaged_at`, `engaged_thread_id` | exists | **missing** |

Nothing in Deliverables 2.3, 3, or 4 can be wired without these. Deliverable 2.1/2.2 (route kill, archive ContributeDiscovery) are the only items that don't depend on the migration.

## Blocker 2 — `contribution_acknowledgments` columns do NOT match the trigger spec

Sprint spec says the Asante trigger writes columns:
`giver_id, receiver_id, need_id, fulfillment_id, currency, kind, created_at`

Actual live schema:

```
id, fulfillment_id, from_profile_id, to_profile_id,
message (NOT NULL), rating, is_public, created_at
```

Differences:
- `giver_id` → table has `from_profile_id`
- `receiver_id` → table has `to_profile_id`
- `need_id` — **does not exist**
- `currency` — **does not exist**
- `kind` — **does not exist**
- `message` is `NOT NULL` (trigger must supply a value)
- Extra columns: `rating`, `is_public`

The spec said: "If column names differ, stop and report the actual schema. Do not invent columns, do not guess." Reporting.

---

## Decision needed before I proceed

Pick one path:

### Option A — Adapt the migration to the existing table (recommended)
Rewrite the Phase 4 migration so the trigger inserts into the *real* columns:
- map `giver_id`→`from_profile_id`, `receiver_id`→`to_profile_id`
- drop `need_id`, `currency`, `kind` from the insert (or store derived data in `message`)
- supply a default `message` like `"Asante for fulfilling: <need title>"`
- ignore `rating`/`is_public` (defaults)

Lowest risk. Keeps existing acknowledgments data intact. Asante moment still works; we lose the `currency` and `kind` discriminator at the row level (would have to derive from `need_fulfillments` join).

### Option B — Extend `contribution_acknowledgments` schema
Add `need_id uuid`, `currency contribution_currency`, `kind text` (and rename or alias the profile columns). Migration grows; existing rows backfilled with defaults. Higher blast radius but matches the spec verbatim.

### Option C — New table `asante_acknowledgments`
Leave legacy `contribution_acknowledgments` alone, create a clean canonical table for the Phase 4 loop. Cleanest separation, but doubles the surfaces the profile "Asante received" section has to read from.

---

## What I will do once you pick

1. Author the corrected Phase 4 migration (need_fulfillments + RLS + indexes + RPCs + trigger fitted to the chosen Option A/B/C + room_curations columns) and submit it via the migration tool for your approval.
2. After approval and apply, re-run the 6 verification queries.
3. Proceed through 4.1 → 4.2 → 4.3 exactly as the prompt specifies.

## Side findings (read-only, not fixed)

- `ContributeDiscovery.tsx` is referenced only by itself in source — orphan confirmed, safe to archive in 2.2.
- `FulfillmentTracker` lives at `src/components/contribute/FulfillmentTracker.tsx` and reads `contribution_fulfillments` directly (no separate service). Will re-point in 2.3 once `need_fulfillments` exists.
- `OpportunityDetail` / `Opportunities` pages are still lazy-imported in `App.tsx`. Several services (`platformNotificationGenerator`, `notificationSystemService`, `diaNudgeEngine`) and components (`RoomEmptyStates`, `FiveCImpactRadar`, `NeedsRenderer`, `ManifestRenderer`) still reference `contribution_fulfillments` — broader than 2.3 scope; will flag in the final report, not fix inline.

Reply with **A**, **B**, or **C** and I will draft the corrected migration immediately.
