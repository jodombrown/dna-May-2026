# DNA Mobile Shell E2E Tests

Playwright specs that validate the shared `DnaMobileHubShell` behavior on real
routes. These are **not** part of the unit test (`vitest`) run because they
require a live dev server and a browser.

## One-time setup

```bash
bun add -D @playwright/test
bunx playwright install chromium
```

## Run

```bash
# Dev server must be up on http://localhost:8080 (or set E2E_BASE_URL)
bunx playwright test --config tests/e2e/playwright.config.ts
```

## What's covered

- `mobileHubShell.scroll.spec.ts` - top bar hides on scroll-down while the
  `tabs` slot and `MobileBottomNav` stay pinned across Discover, Connect,
  and Contribute.
- `messagesFooter.spec.ts` - `/dna/messages` renders `MobileBottomNav` at the
  same fixed position as Discover (regression for the missing footer bug).

Unit-level coverage of the shell chrome lives at
`src/test/dnaMobileHubShell.test.tsx`.
