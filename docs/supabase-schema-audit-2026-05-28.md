# DNA Supabase Schema Audit

**Project ref:** `ybhssuehmfnxrzneobok`
**Generated:** 2026-05-28
**Scope:** `public` schema only. Auth/storage/realtime untouched.
**Method:** Live introspection via `pg_catalog` + `information_schema` + Supabase linter (no estimates).

This document is meant for the engineering team. It pairs with `docs/codebase-audit-2026-05-27.md` (application audit) and gives the database-side evidence for the Tier 3 keep / hybrid-rebuild / restart decision.

---

## 1. Headline numbers

| Object                         | Count |
| ------------------------------ | ----: |
| Base tables (public)           |   251 |
| Views                          |     5 |
| Foreign keys                   |   307 |
| Indexes                        |   846 |
| RLS policies                   |   635 |
| Functions / RPCs               |   462 |
| Triggers (user-defined)        |   143 |
| Enum types                     |    38 |
| Realtime-published tables      |    14 |
| Linter findings (ERROR + WARN) | **821** (1 ERROR, 820 WARN) |

**Read this number first:** 251 tables and 462 functions for what is documented as a 5-module product (Connect / Convene / Collaborate / Contribute / Convey). Even after subtracting reference data (countries, regions, continents, provinces, hashtags), the application surface area is roughly **3-4x what the feature set justifies.** Most of the bloat is duplication, not richness — see §4.

---

## 2. Domain map (where the 251 tables actually live)

Tables grouped by the module they belong to. `*` marks tables that overlap with another group (counted once, in the most natural home).

### Identity & access (4)
`profiles` (**217 cols**), `users` (14 cols, FK → `auth.users`), `user_roles`, `username_history`

### Connections / social graph (7)
`connections`, `user_connections`, `user_follows`, `user_blocks`, `blocked_users`, `skill_connections`, `introductions`

### Messaging — three parallel stacks (16)
- **Stack A (legacy 1:1):** `conversations`, `messages`, `message_receipts`, `message_reactions`, `message_mentions`, `message_rate_log`, `starred_messages`
- **Stack B (new threaded):** `conversations_new`, `messages_new`, `conversation_participants`, `group_message_mentions`, `group_starred_messages`
- **Stack C (group-as-conversation):** `group_conversations`, `group_messages`
- **Feedback channel (own messaging engine):** `feedback_channels`, `feedback_channel_memberships`, `feedback_messages`, `feedback_attachments`, `feedback_reactions`

### Feed & posts (16)
`posts` (**38 cols**), `community_posts`, `group_posts`, `post_likes`, `post_reactions`, `post_comments`, `post_bookmarks`, `post_shares`, `post_views`, `post_reports`, `post_analytics`, `post_hashtags`, `comments`, `comment_reactions`, `comment_reports`, `saved_posts`, `hidden_posts`, plus feed-specific: `feed_bookmarks`, `feed_comments`, `feed_reactions`, `feed_reshares`, `feed_engagement_events`, `feed_research_responses`

### Events / Convene (24)
`events` (**42 cols**), `events_old` (24 cols), `events_log`, `event_attendees`, `event_registrations`, `event_registration_questions`, `event_ticket_types`, `event_tickets`, `event_ticket_holds`, `event_checkins`, `event_waitlist`, `event_promo_codes`, `event_roles`, `event_comments`, `event_analytics`, `event_blasts`, `event_reminder_logs`, `event_reports`, `community_events`, `community_event_attendees`

### Roadmap event suite (16) — feels like a separate product
`roadmap_attendees`, `roadmap_event_photos`, `roadmap_impact_metrics`, `roadmap_reminder_prefs`, `roadmap_saved_sessions`, `roadmap_session_reminder_sends`, `roadmap_sessions`, `roadmap_speaker_followers`, `roadmap_speaker_update_sends`, `roadmap_speaker_updates`, `roadmap_speakers`, `roadmap_sponsor_digest_sends`, `roadmap_sponsor_leads`, `roadmap_sponsor_managers`, `roadmap_sponsors`, `roadmap_subscribers`, `roadmap_survey_responses`, `roadmap_testimonials`, `roadmap_tracks`

### Spaces / Collaborate (12)
`spaces` (26 cols), `collaboration_spaces` (10 cols), `space_members`, `space_roles`, `space_tasks`, `space_task_dependencies`, `task_comments`, `space_attachments`, `space_updates`, `space_activity_log`, `space_templates`, `collaboration_memberships`

### Contribute / opportunities / needs (19) — heaviest duplication zone
`opportunities`, `opportunity_applications`, `opportunity_bookmarks`, `opportunity_contributions`, `opportunity_interests`, `applications`, `contribution_cards`, `contribution_needs`, `contribution_offers`, `contribution_fulfillments`, `contribution_manifests`, `contribution_acknowledgments`, `need_declarations`, `need_fulfillments`, `currency_stances`, `room_curations`, `project_contributions`, `projects`, `initiatives`, `milestones`, `impact_attributions`, `impact_log`, `impact_badges`, `verified_contributors`

### Groups / communities (10)
`groups`, `group_members`, `group_join_requests`, `group_post_comments`, `group_post_likes`, `communities`, `community_memberships`, `community_posts`, `user_communities`

### DIA / ADIN — two parallel intelligence systems (19)
- **DIA:** `dia_brief_cards`, `dia_brief_interactions`, `dia_brief_snoozes`, `dia_insights`, `dia_messaging_events`, `dia_messaging_feedback`, `dia_messaging_prefs`, `dia_nudges`, `dia_queries`, `dia_query_log`, `dia_user_usage`
- **ADIN (older):** `adin_contributor_requests`, `adin_nudges`, `adin_preferences`, `adin_recommendations`, `adin_signals`, `user_adin_profile`, `nudges`, plus views `adin_cost_tracking`, `adin_daily_stats`, `adin_popular_queries`

### Hashtags (5)
`hashtags`, `hashtag_followers`, `hashtag_analytics`, `hashtag_usage_requests`, `reserved_hashtags`, `post_hashtags`

### Notifications (3)
`notifications`, `hub_notification_signups`, `push_subscriptions`

### Reference / geo (5)
`continents`, `regions`, `countries` (29 cols, 49 rows), `provinces`, `causes`, `skills`, `badge_definitions`

### Remittance microsite (19) — feels like a separate product
All 19 `remittance_*` tables. Have their own subscribers table. Not wired to user identity (no FK to profiles).

### Admin / moderation / safety (12)
`admin_activity_log`, `content_flags`, `content_moderation`, `user_reports`, `event_reports`, `comment_reports`, `post_reports`, `muted_authors`, `rate_limit_checks`, `release_features`, `releases`, `feature_flags`, `module_status`

### Ads / sponsors / monetization (10)
`ad_campaigns`, `ad_intake_submissions`, `advertisers`, `sponsors`, `sponsor_placements`, `billing_transactions`, `platform_fees`, `monthly_reports`

### Analytics / telemetry (11)
`activity_events`, `analytics_events`, `error_logs`, `cron_job_logs`, `dashboard_analytics`, `user_engagement_tracking` (699 rows), `user_interactions`, `feed_engagement_events`, `geographic_relevance`, `skill_analytics`, `profile_completion`, `profile_views`, `hub_metrics`

### ADA (experimentation framework — 5)
`ada_cohorts`, `ada_cohort_memberships`, `ada_experiments`, `ada_experiment_variants`, `ada_experiment_assignments`, `ada_policies`

### Onboarding / waitlist (5)
`beta_waitlist`, `waitlist_signups`, `waitlist_notes`, `user_onboarding_selections`, `affirmations`, `invites`

### Misc / unclear ownership (8)
`organizations`, `organization_verification_requests`, `newsletter_subscriptions`, `entity_vectors`, `user_vectors`, `political_digest`, `innovation_data`, `diaspora_data`, `economic_indicators`, `user_dna_points`, `trend_follows`, `search_preferences`, `user_dashboard_preferences`, `user_last_view_state`, `user_recommendations`, `alpha_feedback`, `user_feedback`

---

## 3. `profiles` is a god table (217 columns)

This single table is the largest piece of technical debt in the database. Inventory of the columns by category, in one place so engineers can see the duplication:

**Identity:** `id, email, full_name, display_name, first_name, middle_initial, last_name, username, pronouns, avatar_url, profile_picture_url, banner_url, banner_type, banner_gradient, banner_overlay, avatar_position`

**Bio / pitch:** `bio, headline, professional_summary, professional_role, profession, intro_text, intro_audio_url, intro_video_url, my_dna_statement, diaspora_story, why_contribute`

**Location (three overlapping representations):**
- Free text: `location, current_country, country_of_origin, country_origin, current_location, current_city, current_region`
- ISO code: `origin_country_code, origin_country_name, current_country_code, current_country_name, continent, country`
- FK: `country_of_origin_id, current_country_id`

**Contact:** `linkedin_url, website_url, twitter_url, twitter_handle, instagram_url, facebook_url, github_url, phone, phone_number, whatsapp_number, preferred_contact, preferred_contact_method, contact_number_visibility, email_visible, availability_visible`

**Professional:** `company, organization, organization_name, organization_category, industry, industry_sectors, sectors, professional_sectors, industries, years_experience, years_of_experience, education, certifications`

**Skills/offers (massive overlap):** `skills, skills_offered, skills_needed, available_for, offers, needs, what_to_give, what_to_receive, contribution_types, contribution_style, mentorship_areas, mentorship_offering, mentorship_interest, seeking_mentorship, availability_for_mentoring, looking_for_opportunities, open_to_opportunities, collaboration_needs, collaboration_tags, support_areas, advocacy_interests, networking_goals, intentions, intents, intent_tags, engagement_intentions`

**Diaspora signals (heaviest drift):** `diaspora_origin, diaspora_status, diaspora_networks, diaspora_tags, diaspora_story, ethnic_heritage, return_intentions, years_in_diaspora, years_in_diaspora_text, africa_focus_areas, african_causes, africa_visit_frequency, impact_regions, impact_areas, impact_goals, impact_scores, impact_scores_updated_at, sdg_focus, focus_areas, regional_expertise, region_tags`

**Tag mirrors (legacy `jsonb` copies of the array columns above):** `interest_tags, skill_tags, sector_tags, contribution_tags, availability_tags, event_interest_tags, language_tags, region_tags`

**Venture/ally:** `venture_name, venture_stage, fundraising_status, user_type, user_role, role, roles, selected_pillars`

**Verification / trust:** `verified, verification_method, verified_at, verification_status, verification_updated_at, agrees_to_values, is_admin`

**Onboarding (4 overlapping flags):** `onboarding_completed, onboarding_completed_at, onboarding_stage, onboarding_progress, onboarding_recommendations_viewed, first_action_completed, first_action_type, tour_completed_at, tour_skipped_at, tour_current_step, tour_last_shown_at`

**Beta program:** `is_beta_tester, beta_phase, beta_expires_at, beta_feedback_count, beta_features_tested, beta_signup_data, beta_status`

**Engagement counters (denormalized — drift-prone):** `connection_count, profile_views_count, follower_count, following_count, profile_completeness_score, profile_completion_score, profile_completion_percentage`

**Privacy / consent (12+):** `is_public, account_visibility, visibility, profile_visibility_settings, email_visible, availability_visible, contact_number_visibility, allow_profile_sharing, show_presence, show_read_receipts, consent_marketing_emails, consent_partner_intros, consent_event_invites, consent_public_search, email_notifications, newsletter_emails, notifications_enabled, notification_preferences`

**Activity / DIA cache:** `last_seen_at, last_active, last_active_at, recent_searches, dia_insight, dia_insight_updated_at, adin_prompt_status, adin_mode, dashboard_version, pinned_activity_ids, hidden_activity_ids`

**Soft delete / misc:** `deleted_at, is_test_account, auto_connect_enabled, role_declared_at, place_declared_at, referrer_id, referral_code, username_changes, username_changes_left, username_change_count, username_changes_count, username_history, language_tags, languages, languages, availability_hours_per_month, available_hours_per_month, location_preference, timezone, preferred_contact_method`

### What this means

- **At least 30 confirmed duplicate column groups** (e.g. `years_experience` + `years_of_experience`, `country_of_origin` + `country_origin`, three `profile_completion*` scores, four `username_change*` counters). Some are writes from old code paths, some from new — neither side knows which is canonical.
- **No referential integrity** for the heritage/country/sector data: free text, ISO code, and FK all live side by side.
- Every INSERT/UPDATE on this table fires **9 triggers** (`normalize_username`, `protect_profile_sensitive_fields`, `trg_protect_profile_privileges`, `set_username`, `set_beta_expiration_trigger`, `trigger_check_verification`, `trigger_check_verification_insert`, `trigger_track_skill_changes`, `trigger_update_last_seen`, `trigger_update_profile_completeness`, `trigger_update_profile_completion`, `update_profile_score`, `on_profile_created_adin_preferences`, `on_auth_user_created_join_feedback`). Some are duplicated (`trigger_update_profile_completeness` AND `trigger_update_profile_completion` AND `update_profile_score`). Profile writes are expensive and side-effect heavy.

**Recommendation:** Hard-collapse to ~50 columns before launch, move arrays to junction tables (`profile_skills`, `profile_causes` already exist but are partially used), and consolidate the privacy fields into one `jsonb`.

---

## 4. Table-level duplication clusters (the keep-or-kill list)

These are the explicit "two tables doing the same thing" pairs. Pick a winner before launch.

| # | Cluster                                         | Tables                                                                                         | Notes                                                                                                                                                |
| - | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | **Events**                                      | `events` (42 col, 5 rows) vs `events_old` (24 col, 0 rows) vs `events_log` (5 col, 2 rows)     | `events_old` still has 9 child FKs pointing at it (`event_registrations`, `event_ticket_types`, `event_blasts`, etc.). Migration is half-done.       |
| 2 | **Conversations / messages**                    | `conversations` + `messages` vs `conversations_new` + `messages_new` + `conversation_participants` | Both sets are RLS-protected and realtime-published. Two messaging code paths in `src/`.                                                          |
| 3 | **Group messaging**                             | `group_conversations` + `group_messages` (Stack C above)                                       | Third messaging stack on top of #2.                                                                                                                  |
| 4 | **Feed reactions / likes**                      | `post_likes` + `post_reactions` + `feed_reactions` + `comment_reactions`                       | Three reaction systems on posts alone. Memory says "5 DNA reactions" (asante, inspired, lets_build, powerful, insightful) — none of these enforce that. |
| 5 | **Bookmarks**                                   | `post_bookmarks` (114 KB) + `feed_bookmarks` + `saved_posts` + `opportunity_bookmarks`         | Four tables, three for posts.                                                                                                                        |
| 6 | **Comments**                                    | `comments` + `post_comments` (15 col) + `feed_comments` + `event_comments` + `group_post_comments` + `task_comments` | Six comment tables. `post_comments` and `feed_comments` cover the same surface.                            |
| 7 | **Spaces**                                      | `spaces` (26 col) vs `collaboration_spaces` (10 col) + `space_members` vs `collaboration_memberships` | `spaces` is canonical per docs. `collaboration_spaces` still has 4 active RLS policies + triggers.                                            |
| 8 | **Contributions / needs / opportunities**       | `opportunities` + `contribution_needs` + `contribution_offers` + `need_declarations` + `need_fulfillments` + `contribution_fulfillments` + `currency_stances` + `room_curations` + `applications` + `opportunity_applications` + `project_contributions` + `opportunity_contributions` | At least **three competing models** for the same Contribute concept. |
| 9 | **Groups vs communities**                       | `groups` + `group_*` vs `communities` + `community_*`                                          | Parallel social-group implementations.                                                                                                               |
| 10 | **Followers / connections**                    | `connections` (canonical, 66 rows) vs `user_connections` (0 rows) vs `user_follows`            | `user_connections` has its own trigger `notify_new_connection_trigger` still firing.                                                                 |
| 11 | **Intelligence layer**                         | `dia_*` (11 tables) vs `adin_*` (8 tables) + `nudges`                                          | DIA is current, ADIN is legacy. Both still active, both still receive writes (`adin_preferences` has 42 rows). |
| 12 | **Users / profiles**                           | `users` (14 col, FK to `auth.users`) vs `profiles` (217 col, FK to `auth.users`)               | `users` is referenced by `communities.created_by`, `user_communities.owner_id`. Dead code path that still has 3 RLS policies + update trigger.       |
| 13 | **Causes**                                     | `causes` table + `profile_causes` junction + `african_causes` array column on profiles        | Three sources of truth for one concept.                                                                                                              |
| 14 | **Skills**                                     | `skills` + `profile_skills` + `skill_connections` + `skill_analytics` + 6 array cols on profile | Same.                                                                                                                                                |

---

## 5. Foreign-key topology (the good news)

Despite the duplication, FK hygiene is mostly OK: **307 FKs**, with sensible `CASCADE` / `SET NULL` semantics. Highlights:

- `profiles.id -> auth.users.id [CASCADE]` and `users.id -> auth.users.id [CASCADE]` — both bind to Supabase auth.
- All `*_members`, `*_messages`, `*_comments`, `*_reactions` cascade on parent delete. No orphan risk.
- Almost every user-owned table uses `auth.users.id` directly as the FK target (not `profiles.id`). 17 tables reference `profiles.id` instead, mostly the newer ones (`contribution_*`, `post_*`, `comment_*`, `opportunity_*`). **Two referential conventions coexist** — engineers must know which one a feature uses or RLS will silently fail.
- **Orphaned references to `events_old`:** `event_registrations`, `event_ticket_types`, `event_ticket_holds`, `event_blasts`, `event_reports`, `event_analytics`, `event_waitlist`, `event_registration_questions` all FK to `events_old`. New code FKs to `events`. The ticketing/registration system is **still running on the old table.**

---

## 6. RLS / security posture

- **RLS is enabled on every public table** (251/251). Confirmed.
- **635 policies total** — average 2.5 per table, which is healthy. No table is policy-less.
- Spot-check on the 10 most user-facing tables (`profiles`, `posts`, `messages`, `conversations`, `events`, `spaces`, `space_members`, `connections`, `notifications`, `user_roles`) shows policies that scope to `auth.uid()` correctly. No `USING (true)` on writes for those tables. `user_roles_select` correctly delegates to a `SECURITY DEFINER has_role()` function — the only safe pattern for role checks.

### Linter findings (821 total)

| Level | Count | Issue                                                              |
| ----- | ----: | ------------------------------------------------------------------ |
| ERROR |     1 | Security Definer **View** (one of the 5 views runs as definer)     |
| WARN  |   384 | Public can EXECUTE a `SECURITY DEFINER` function                   |
| WARN  |   402 | Signed-in users can EXECUTE a `SECURITY DEFINER` function          |
| WARN  |    13 | Public storage bucket allows listing                               |
| WARN  |    11 | RLS policy `USING (true)` on write paths                           |
| WARN  |    10 | Function with mutable `search_path`                                |
| WARN  |     1 | Security definer view                                              |

**What to take from this:**
- The 786 "public can EXECUTE security definer function" warnings are **not by themselves a vulnerability** — most of those functions check `auth.uid()` internally. But it does mean **almost every business operation goes through a definer RPC**, which makes the surface area for a single-policy bug catastrophic. There is no defence-in-depth.
- The 11 `USING (true)` write policies must be inspected and fixed — those *are* bugs.
- The 13 public buckets listing → confirm avatar/banner buckets only, no documents.

---

## 7. Functions / RPCs (462 total)

Breakdown by intent (from naming):

| Prefix       | Count | Purpose                                            |
| ------------ | ----: | -------------------------------------------------- |
| `rpc_*`      |    44 | App-callable RPCs (events, tasks, notifications, profile bundle) |
| `get_*`      |    71 | Read-side aggregates (dashboard counts, feed, etc.) |
| `notify_*`   |    13 | In-DB notification creators                        |
| `trg_* / *_trigger` |  ~50 | Trigger bodies                                |
| `update_*`   |    34 | Trigger-side timestamp/counter updaters            |
| `track_* / log_*` |   13 | Telemetry writers                              |
| `is_* / can_* / has_*` |  21 | RLS helpers (security definer)             |
| Everything else | ~216 | Domain logic                                    |

**Observations:**
- **~370 of the 462 are `SECURITY DEFINER`** (80%). That is the source of the 786 linter warnings. It also means the app is implicitly trusting the DB layer for every authz decision — a single bad definer is game over.
- **Overloads:** 14 functions have two or three signatures with the same name (`calculate_match_score`, `find_adin_matches`, `get_feed_posts`, `get_group_conversations_for_user`, `get_top_cross_transitions`, `rpc_adin_recommend_opportunities/people/spaces`, `rpc_create_post` (×3), `rpc_event_register` (×3), `create_notification` (×2), `create_entity_feed_post` (×2)). Some are intentional, some are stale shadow copies that should be dropped.
- **6 different profile-completion functions** (`calculate_profile_completeness`, `calculate_profile_completeness_score_new`, `calculate_profile_completion_percentage`, `calculate_profile_completion_score`, `compute_profile_completion_score`, `update_profile_completion`). All write back to different columns on `profiles`. This is the source of the four `profile_completion*` columns drift.

---

## 8. Triggers (143 user-defined)

Concentrations:

- **`profiles`: 14 triggers** — see §3.
- **`event_registrations`: 12 triggers** — three of them (`event_reg_change`, `after_event_reg_insert_update_count`, `trg_event_regs_after_ins`) appear to do overlapping work after INSERT. Plus three more on DELETE.
- **`spaces` / `collaboration_spaces`: 9 combined triggers** for membership creation, channel creation, timestamp updates. Two `updated_at` triggers on `collaboration_spaces` (`t_spaces_updated` and `update_collab_spaces_updated_at`) — redundant.
- **Messaging:** 4 triggers on `messages`, 3 on `messages_new`. Both stacks have separate `notify_new_message` triggers — a message sent in one stack does not generate a notification in the other.

**Risk:** trigger-driven side effects make data migrations dangerous. Any backfill into `profiles` will fire all 14 triggers per row.

---

## 9. Realtime publication

Only **14 tables** are published to `supabase_realtime`:
`comments, conversations, event_attendees, event_comments, events, group_conversations, group_messages, message_reactions, messages, notifications, post_likes, post_reactions, posts, profiles`

Notably absent: `messages_new`, `conversations_new`, `space_*`, `dia_nudges`, `feed_*`, `connections`. The new messaging stack has **no realtime subscription** — the client polls or the trigger sends a notification. Consistent with the codebase memory's "filtered realtime only" rule, but it confirms the old stack is still the live one.

---

## 10. Enums (38)

Healthy mix. A few worth flagging:

- `dna_identity_role: returnee, anchor, ally, exploring` — referenced by **zero** tables (`profiles.role` is `text`, not this enum). Defined for a column that was never wired. Matches the app-audit finding.
- `task_status: open, in_progress, done` — but `space_tasks` has 18 columns including its own status fields; verify the enum is the one used.
- Two contribution enums that overlap: `contribution_type: time, expertise, network, capital` vs `contribution_currency: expertise, network, resources, capital`. Different vocabularies for the same concept.

---

## 11. Indexes (846)

846 indexes across 251 tables = ~3.4 per table average. Without per-index usage stats (would require `pg_stat_user_indexes` over a longer window), the headline risk is:
- `analytics_events` (4.5 MB, 11.9K rows) and `error_logs` (2.6 MB, 1.2K rows) are the only tables with material size. The database is mostly empty.
- `profiles` is 1.1 MB for 41 rows — that's `217 columns × bloat from 14 triggers + JSONB columns`. Will balloon fast at scale.
- Recommend running `pg_stat_user_indexes` after 30 days of production traffic and dropping any index with `idx_scan = 0`.

---

## 12. Row counts (what's actually being used)

Only tables with >10 estimated rows, in descending order:

| Table                         | Rows | Notes                          |
| ----------------------------- | ---: | ------------------------------ |
| `analytics_events`            | 11,948 | Heaviest writer              |
| `user_engagement_tracking`    |   699 | Active                         |
| `post_hashtags`               |   299 | Active                         |
| `post_views`                  |   202 | Active                         |
| `feed_engagement_events`      |   174 | Active                         |
| `hashtags`                    |   168 | Active                         |
| `notifications`               |   156 | Active                         |
| `remittance_corridor_comparisons` | 107 | Static seed data           |
| `reserved_hashtags`           |    92 | Static                         |
| `remittance_compare_corridors` |   85 | Static seed                   |
| `skill_analytics`             |    82 | Active                         |
| `connections`                 |    66 | Active                         |
| `countries`                   |    49 | Reference                      |
| `profiles`                    |    41 | **41 real users.** Everything above must be sized for this. |
| `feedback_channel_memberships`|    41 | Active                         |
| `adin_preferences`            |    42 | Active (legacy intelligence)   |
| `messages`                    |    33 | Active                         |
| `conversation_participants`   |    28 | Active                         |
| `feedback_messages`           |    25 | Active                         |
| `conversations`               |    17 | Active                         |

**~200 tables have ≤1 estimated row.** The database is pre-launch. There has never been a better moment to consolidate.

---

## 13. Recommendations for the engineering team

In execution order. None of these change product scope.

### Tier A — must do before any paid traffic
1. **Pick a winner in each of the 14 duplication clusters in §4.** Document the choice. Drop or rename-to-`_legacy` the loser. Start with: events (kill `events_old`), conversations (kill `conversations`/`messages`), posts vs feed reaction tables.
2. **Collapse `profiles` to ≤60 columns.** Move arrays to existing junction tables. Move privacy flags into one `jsonb`. Pick one of each duplicate pair (`years_experience` vs `years_of_experience`, etc.).
3. **Fix the 11 `USING (true)` write policies** flagged by the linter.
4. **Fix the 1 ERROR-level security-definer view** flagged by the linter.
5. **Migrate the 8 `events_old` child FKs onto `events`** or formally archive them.
6. **Unify the 6 profile-completion functions** into one. Drop the four `profile_completion*` columns down to one.

### Tier B — before scale
7. **Reduce `SECURITY DEFINER` usage from 80% to <40%.** Use RLS for authz, not definer functions, anywhere it is feasible.
8. **Set `search_path` on the 10 definer functions** flagged by the linter (CVE-class issue).
9. **Pick one of DIA / ADIN.** Delete the other.
10. **Decide if `roadmap_*` (19 tables) and `remittance_*` (19 tables) belong in this database** or are separate Supabase projects. They have no FK to user identity.
11. **Drop the unused `dna_identity_role` enum** and the unused `users` table (or commit to it and drop `profiles.is_admin`/`profiles.user_type` in favour of it).
12. **De-duplicate triggers** (`event_registrations`, `collaboration_spaces`, `profiles`).

### Tier C — hygiene
13. Set up a weekly job: `pg_stat_user_indexes` → drop indexes with `idx_scan = 0` after 60 days.
14. Add CI check: any new migration that adds a column to `profiles` requires sign-off.
15. Document the FK convention (`auth.users.id` vs `profiles.id`) and pick one for all new tables.

---

## 14. Verdict (database layer only)

The schema **is salvageable** — RLS is on everywhere, FKs are sound, the realtime surface is narrow, and the duplication is concentrated in identifiable clusters rather than spread randomly. None of the bloat is structural; it is the accumulated weight of multiple half-finished migrations.

But it is **not launch-ready as-is.** The combination of a 217-column god-table, three parallel messaging stacks, two parallel intelligence systems, three parallel contribution models, and 786 `SECURITY DEFINER` warnings means that **any production incident will be expensive to diagnose** because there is no single canonical path for the most common operations (send message, create post, register for event, contribute, react).

The database evidence aligns with the application audit's recommendation: **hybrid rebuild.** A 4-6 week freeze focused on §13 Tier A items, executed by one engineer with DBA experience, would leave the team with a schema that the product can actually ship on.

---

*End of audit. Cross-reference: `docs/codebase-audit-2026-05-27.md` for the application-side findings.*
