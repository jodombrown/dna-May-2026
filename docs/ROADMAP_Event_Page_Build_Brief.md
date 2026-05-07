# ROADMAP Event Page — Build Brief

> Reference document for the public-facing `/roadmap` page.
> The page is the marketing and pre-registration home for DNA's annual flagship event,
> ROADMAP, debuting December 2026 in Los Angeles.

## Purpose

ROADMAP is DNA's annual flagship event. **R**eturn **O**f the **A**frican **D**iaspora to **M**obilize in support of **A**frica's **P**rogress. Pan-African. Pan-sector. Once a year. In person.

The `/roadmap` route is a sharable partnership-outreach anchor and pre-registration capture for the inaugural edition, before the full Convene-powered registration flow goes live.

## Route

- Path: `/roadmap`
- Public, no auth required
- Mobile-first at 375px baseline
- WCAG AA

## Inheritance

The page inherits DNA's design system completely:

- Lora for display headings; Inter for body
- Emerald primary, Forest supporting, Copper accent (no purple, no tech-blue)
- 16px border radius (`rounded-dna-xl`)
- Cultural patterns (Kente, Mudcloth, Ndebele, Adinkra) at 5–10% opacity
- DNA's `Footer` component (no global footer override)
- `UnifiedHeader` for site navigation

## Page sections (single scrolling page, in order)

1. **Hero** — ROADMAP wordmark in Lora; "Powered by DNA" lockup; headline; subhead; key facts row (December 2026 · Los Angeles · The Beehive); primary CTA email capture; secondary "Learn more" smooth-scroll.
2. **What ROADMAP Is** — three-paragraph block including the acronym.
3. **The Five C's, Made Physical** — three day cards (Day 1 Connect; Day 2 Collaborate & Contribute; Day 3 Convey). Horizontal scroll on mobile, grid on desktop. Expandable detail.
4. **Inaugural Details** — date, city, venue, venue story (SoLa Impact's Black-owned OZ business campus, Goodyear Tract, the first OZ business campus in the nation), embedded Leaflet map.
5. **The Mobilization Job** — second-person bulleted list of Connect, Collaborate, Contribute, Convey, Convene actions for attendees.
6. **Who's in the Room** — five-tier audience breakdown.
7. **Partners** — placeholder grid; partnership inquiries email.
8. **Speakers** — placeholder grid; "announced beginning July 2026."
9. **Frequently Asked** — 8 accordion questions.
10. **Footer CTA** — email capture "Be the first to know when registration opens."

## Data

### `roadmap_subscribers`

Migration: `supabase/migrations/20260507035300_roadmap_subscribers.sql`

| Column          | Type           | Notes                                          |
|-----------------|----------------|------------------------------------------------|
| `id`            | `uuid`         | PK, default `gen_random_uuid()`                |
| `email`         | `text`         | required, format-checked                       |
| `source`        | `text`         | which CTA captured the signup (default `hero`) |
| `edition_year`  | `int`          | which edition (default `2026`)                 |
| `subscribed_at` | `timestamptz`  | default `now()`                                |

Unique index on `(email, edition_year)` — same email re-signing for the same year
is treated as success. RLS allows anonymous insert; admin-only select; no update/delete.

## SEO

- Title: `ROADMAP 2026 | DNA's Annual Diaspora Mobilization Event | Los Angeles`
- Description: `December 2026, Los Angeles. DNA's annual flagship event for the African diaspora. Pan-African, pan-sector, in person, once a year.`
- Canonical: `https://diasporanetwork.africa/roadmap`
- Schema.org `Event` markup with `Place` (The Beehive)
- OG image: `/og-roadmap.png` placeholder (replace before launch)

## Navigation surfaces

- `/roadmap` is added to `publicNavItems` as a featured entry (rendered with a "New" pill in the header).
- A non-intrusive banner on `/` drives traffic to `/roadmap`.

## Constraints honored

- No new design tokens or colors beyond the existing DNA palette
- No new dependencies (Leaflet + react-leaflet, shadcn/ui, Tailwind, framer-motion already installed)
- No registration flow — that ships separately on the Convene module
- Content is hardcoded for v1; CMS extraction is phase 2

## Style rules

- No em-dashes anywhere in copy on this page
- No purple, no tech-blue
- Use second-person voice in The Mobilization Job section
- "Powered by DNA" lockup is small, uppercase, tracked, sand-on-emerald or emerald-on-sand
