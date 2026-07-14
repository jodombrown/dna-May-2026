Regenerate `src/integrations/supabase/types.ts` from the live Supabase schema so the `get_public_event` RPC signature reflects the current database.

## What changes

Only one file changes: `src/integrations/supabase/types.ts`.

The `get_public_event` RPC's `Returns` type will be updated to match the live DB:

- Add: `status: string`
- Add: `visibility: string`
- Remove: `is_cancelled: boolean`

All other tables, enums, functions, and RPC signatures in the file remain unchanged — this is a targeted regeneration for the one function whose signature drifted.

## How

Since Lovable regenerates `types.ts` automatically from the connected Supabase project after schema/migration changes (and direct edits to that file are disallowed by project rules), the mechanism is:

1. Trigger a types regeneration against project `ybhssuehmfnxrzneobok` so the generated `Returns` block for `get_public_event` picks up `status` / `visibility` and drops `is_cancelled`.
2. Verify the diff on `types.ts` shows exactly those three field changes under `Functions.get_public_event.Returns` and nothing else.

## Follow-up (not in this task)

Callers of `get_public_event` that still read `is_cancelled` (e.g. `PublicEventPage`, any event-state helpers) will need to switch to `status === 'cancelled'` / `visibility === 'public'`. Flag after regeneration; do not change in this task unless you want it bundled.

## Confirm before I proceed

Do you want this task limited strictly to regenerating `types.ts`, or should I also update the call sites that read `is_cancelled` so the app keeps compiling?