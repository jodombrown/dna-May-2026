# DNA Mobile Hub Header — Bubble Behavior

The single source of truth for the mobile top row across `/dna/*` routes is
`src/components/mobile/DnaMobileHeader.tsx`. Every hub renders the same
locked layout (logo, action bubble, notification bell, avatar) and only
differs in the bubble configuration.

## Bubble contract per hub

| Hub                | Route                | `bubble.kind` | Tap behavior                                  |
| ------------------ | -------------------- | ------------- | --------------------------------------------- |
| Feed               | `/dna/feed`          | `composer`    | Opens UniversalComposer in `post` mode        |
| Connect            | `/dna/connect`       | `search`      | Focuses the inline search input               |
| Convene            | `/dna/convene`       | `composer`    | Opens UniversalComposer in `event` mode       |
| Contribute         | `/dna/contribute`    | `composer`    | Opens UniversalComposer in `opportunity` mode |
| Convey (Story Hub) | `/dna/convey`        | `search`      | Filters stories as the user types             |
| Collaborate        | `/dna/collaborate`   | `static`      | No-op while the module is being rebuilt       |

Rules:

1. The bubble is the only per-hub variation in the top row. Logo position,
   bell, and avatar stay byte-identical across hubs.
2. `composer` bubbles always open `UniversalComposer` via
   `useUniversalComposer().open(mode)`. Never use `window.location.href`.
3. `search` bubbles must be controlled (`value` + `onChange`) and filter
   list state in the same hub (no navigation).
4. `static` bubbles are read-only placeholders. Use them for hubs that
   are temporarily disabled.

## Header overlap rule

Every hub that mounts `DnaMobileHeader` as a `fixed top-0` element MUST
measure its rendered height with `useMobileHeaderHeight(headerRef)` and
apply it as `paddingTop` on the scroll container. This guarantees content
never slips under the header on any device. Hardcoded `pt-14` values are
forbidden in hub roots.

See `src/test/mobileHeaderOverlap.test.tsx` for the regression check.
