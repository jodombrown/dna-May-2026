BEGIN;

-- ============================================================
-- BD032 - events/events_old consolidation: husk drops
-- Destructive. Gated behind BD031 + clean all-object re-audit.
--
-- NO CASCADE - deliberate. Re-audit confirmed both tables are
-- self-contained (no external FK/policy/fn/view dependents).
-- A bare DROP must therefore either succeed cleanly or ERROR
-- loudly; it must never silently cascade. If either statement
-- raises a dependency error, STOP and re-audit - do not add CASCADE.
-- ============================================================

DROP TABLE public.events_old;     -- childless husk (0 rows); FKs re-parented in BD031
DROP TABLE public.event_tickets;  -- thin unused husk (0 rows); lost the stack-of-record call (BD031)

COMMIT;