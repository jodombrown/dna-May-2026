# DNA Clickability Checklist (Manual)

Track every visible data point under `/dna/*` and confirm it routes somewhere.
Run `bunx tsx scripts/check-dna-clickability.ts` for an automated companion sweep.

## Conventions
- Every count / stat / chip / badge MUST be a button or link.
- Min touch target: 44px. Visible focus ring. `aria-label`.
- No `window.location.href` for internal nav. Use `useNavigate` / `<Link>`.

## Surfaces

### /dna/feed
- [x] FeedHeroGreeting pulse meta segments
- [x] PulseCompass breakdown tiles (5 modules x 2)
- [ ] FeedActivitySidebar counts
- [ ] FeedHero "X posts today" chip

### /dna/{username} (Profile)
- [x] ProfileV2QuickStats: Connections / Posts / Spaces / Events
- [x] ProfileBadges (each badge -> module hub)
- [x] FiveCImpactRadar spokes + breakdown rows
- [ ] ProfileV2Activity recent items
- [ ] DiasporaFootprint city / country pins

### /dna/connect (+ network, discover)
- [x] HubStatsBar tiles
- [x] DiaProfileCard relevance / mutuals / skills chips
- [ ] Suggestion card "shared factors" pills
- [ ] Network filter tabs (Connections / Pending / Sent)

### /dna/convene
- [x] HubStatsBar tiles
- [ ] EventCard date / location / attendee chips
- [ ] Curated lane "view all" links

### /dna/collaborate
- [x] HubStatsBar tiles
- [ ] SpaceCard member count, task count
- [ ] Activity stream items

### /dna/contribute
- [x] HubStatsBar tiles
- [ ] Sector chips
- [ ] Offer / Need card meta (status, fulfillment %)

### /dna/convey
- [x] HubStatsBar tiles
- [ ] Story card reactions / comments counts
- [ ] Tag chips

### /dna/notifications
- [ ] Each notification row (whole row clickable)
- [ ] Filter tabs

### /dna/messages
- [x] Conversation list rows
- [ ] Unread badge -> jump to first unread

### /dna/dia
- [x] DIAInsightCard share / refresh controls
- [ ] Suggested-people chips
- [ ] Trend indicators
