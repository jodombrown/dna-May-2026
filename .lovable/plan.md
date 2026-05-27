# Codebase Audit Plan — jodombrown/dna

Goal: produce `docs/codebase-audit-2026-05-27.md` as evidence for keep / hybrid-rebuild / restart decision. Brutal, evidence-led, file:line-cited. Section 5 is pure extraction; all other sections are full audit + interpretation.

## Execution strategy

Given the scale (~1,550 TS files, 763 migrations, 330+ tables, 500+ components), the audit will be run as **parallel investigation tracks** via subagents, then synthesized into one document. Progressive commits per section so nothing is lost if the run is interrupted.

### Track 1 — Schema-vs-Code Drift (Category 1)
- Parse `src/integrations/supabase/types.ts` for table + column inventory
- Parse `supabase/migrations/` for enum definitions
- For each public table: `rg "from\(['\"]<table>['\"]" src/` to find consumers
- For each column: `rg "\.<column>\b"` cross-referenced with table context
- Run `SELECT DISTINCT <enum_col>` via supabase--read_query for actual stored values
- `rg "service_role|SUPABASE_SERVICE_ROLE_KEY" src/` for client-side bypass smell
- Deep-dive: `profiles.diaspora_status`, `profiles.user_type`

### Track 2 — Docs-vs-Code Drift (Category 2)
- Inventory: `find . -name "*.md" -not -path "./node_modules/*"` + JSDoc grep
- For each doc: extract claims, grep referenced files/symbols, flag stale
- Flag broken cross-refs (links to missing files)
- Special: `docs/ONBOARDING_FLOW_SPEC.md` (verify existence — earlier check showed missing), README, ARCHITECTURE

### Track 3 — Architectural Drift (Category 3)
- Dead code: `npx ts-prune` or manual `rg "import.*from ['\"]@/<path>['\"]"` per file
- Route audit: parse `src/App.tsx` Route definitions, cross-ref against `<Link>`/`navigate(` call sites
- Hook duplication: group `src/hooks/` by domain prefix, flag ≥3 overlapping
- Supabase pattern audit: count `supabase.from`, `.rpc(`, custom wrappers — flag inconsistency
- God files: `find src -name "*.ts*" | xargs wc -l | sort -rn | head -50`
- Circular deps: `npx madge --circular src/`

### Track 4 — Dependency Drift (Category 4)
- `npm ls --depth=0`, cross-ref against `rg "from ['\"]<pkg>['\"]" src/`
- `npm outdated` for version lag
- `npm audit` for CVEs
- Single-file usage: count import sites per package
- Duplicate-purpose detection (date libs, icon libs, state libs, http libs)

### Track 5 — UX-vs-Foundation Extraction (Category 5) — NO INTERPRETATION
- Pure ripgrep, output as tables per group (A–E)
- Restrict to customer-facing surfaces: `.tsx`, `.ts` string literals, exclude tests/migrations/types.ts
- Each hit: term | file:line | 2 lines context
- Whole-word case-insensitive where specified; capital-D Diaspora needs case-sensitive

### Track 6 — Test Coverage Drift (Category 6)
- `find src -name "*.test.*"` inventory
- `bunx vitest run` — capture pass/fail per file
- `bunx vitest run --coverage` for coverage %
- Zero-coverage flows: grep route files for auth/onboarding/feed/profile/settings/search, cross-ref against test inventory
- Snapshot staleness: compare snapshot mtime vs source mtime

## Deliverable structure

```
docs/codebase-audit-2026-05-27.md

# Executive Summary
- Total findings: N
- CRITICAL: N | SIGNIFICANT: N | MINOR: N | COSMETIC: N (Sections 1-4, 6)
- Pattern read: <one sentence>
- src/ LOC total: N | Estimated drift-affected: N% 

# Section 1 — Schema-vs-Code Drift
[findings: Category | Severity | File:Line | Description | Recommendation]

# Section 2 — Docs-vs-Code Drift
[findings]

# Section 3 — Architectural Drift
[findings]

# Section 4 — Dependency Drift
[findings]

# Section 5 — UX-vs-Foundation Extraction (extraction only)
## Group A — Sacred canon
| Term | File:Line | Context |
## Group B — D054 vocabulary
## Group C — Pre-D054 legacy
## Group D — Removed onboarding patterns
## Group E — Mythic register

# Section 6 — Test Coverage Drift
[findings]

# Engineering Recommendation
Keep / Hybrid / Restart + rationale grounded in findings.
```

## Progressive commit discipline

After each track completes, append its section to the doc and stop to verify before moving on. If session capacity runs out mid-track, the prior tracks are already committed. Order of execution: 5 (fastest, pure extraction) → 4 → 1 → 3 → 2 → 6 → Recommendation.

## What I will NOT do

- Interpret Section 5 hits (founder + Claude-with-Notion-access will)
- Make the keep/hybrid/restart decision (only advise)
- Soften findings to spare feelings
- Skip file:line citations
- Modify any source code as part of the audit

## Expected runtime

This is a multi-hour job. Subagents will be spawned in parallel where independent. Tool calls in the hundreds. The plan is to grind through it rather than promise speed.

## Open question before I start

The earlier scoping pass confirmed `docs/ONBOARDING_FLOW_SPEC.md` does not exist in the repo. Section 2 will report that as a finding (doc referenced in the audit brief is missing). No blocker — proceeding on approval.
