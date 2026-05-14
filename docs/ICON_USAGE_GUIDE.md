# Icon Usage Guide

Last updated: 2026-05-11

This guide is the single source of truth for which icons appear on which
navigation surface. It is enforced by `scripts/check-icon-duplicates.ts`
(run via `npm run lint:icons`, also wired into `prebuild`).

## Scope

In scope (every icon must be unique within the surface):

- Mobile bottom dock (`PulseDock`) and tray (`PulseDockTray`)
- Top tab bars (Feed, Connect, Convene, Collaborate, Contribute, Convey)
- Header utility rows (notifications, profile, search)
- Sidebars (settings, admin, left nav)
- Empty-state hero icons paired with a tab

Out of scope (intentional repetition kept):

- Inline meta icons inside cards (`MapPin` for every location, `Calendar`
  for every date, `Users` for every attendee count, `Clock`, `Globe`)
- Action button icons (`MessageCircle` on every Message button,
  `Bookmark` on every save, `Share2` on every share)
- Decorative section accents

These are a visual vocabulary. Repeating them helps users scan; changing
them per card hurts recognition.

## Reserved Icons

These icons have a single semantic meaning. Do NOT use them for any
other purpose anywhere on the platform.

### Adinkra (module identity only)

| Icon | Reserved for |
|------|--------------|
| `Sankofa` | CONNECT module |
| `Nkonsonkonson` | CONVENE module |
| `FuntunfunefuDenkyemfunefu` | COLLABORATE module |
| `Adinkrahene` | CONTRIBUTE module |
| `Mpatapo` | CONVEY module (file is named `Mpatapo.tsx` for historical reasons; renders Mate Masie artwork) |
| `MateMasie` | DIA (Diaspora Intelligence Agent) |

Adinkra icons are NEVER used as decoration in generic feed/UI chrome.
Enforced by `scripts/check-adinkra-usage.ts`.

### Lucide (navigation tabs)

| Icon | Reserved for |
|------|--------------|
| `Users` | Connect "Members" tab (directory of people) |
| `UserPlus` | Feed "My Network" tab (people you connect with) |
| `Network` | Connect "Network" tab (your graph) |
| `Newspaper` | Feed "All" tab |
| `Compass` | Feed "For You" tab |
| `PenSquare` | Feed "Mine" tab |
| `Bookmark` | Feed "Saved" tab |
| `Home` | Pulse Dock center (Feed home) |
| `Grid3X3` | Pulse Dock "More" trigger |
| `MessageCircle` | Connect "Messages" tab AND inline Message buttons (one tab use only) |
| `Bell` | Notifications |
| `Settings` | Settings entry |
| `User` | Profile entry |

### Allowed lucide pool for new tabs

Pick from this shortlist before introducing a novel icon:

- People: `UserCheck`, `UserCircle`, `Contact`
- Network/graph: `Share2`, `GitBranch`
- Content: `FileText`, `BookOpen`
- Discovery: `Search`, `Telescope`, `Map`
- Time/events: `CalendarDays`, `Clock`
- Comms: `MessageSquare`, `Mail`, `Send`
- Chrome: `Filter`, `SlidersHorizontal`, `MoreHorizontal`

Banned outright (per `mem://style/iconography-rules`): `Sparkles`, `Zap`,
`Rocket`, `Wand2`, `Bot`.

## Accessibility

Every icon-only button in a nav surface MUST have:

1. `aria-label` describing the destination ("Open My Network feed").
2. A `<Tooltip>` with the same label for sighted users on hover/focus.
3. Visible text for the active item (DNA tab pattern shows the label
   only on the active tab to save space, which is fine because the
   `aria-label` covers the inactive ones for screen readers).

## Adding a new nav surface

1. Add the file to `NAV_SURFACES` in
   `scripts/check-icon-duplicates.ts`.
2. Add any new reserved icons to `RESERVED_ICONS` in the same file and
   to the table above.
3. Add `aria-label` + `<Tooltip>` to every icon button in the surface.
4. Run `npm run lint:icons` locally before opening the PR.

## Why this exists

Two clashes shipped to users:

- "My Network" feed tab used `Users`, the same as Connect "Members".
- Various empty-state icons matched their parent tab icon, which read
  as a duplicate at a glance.

This guide + lint script prevent recurrence.
