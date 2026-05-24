# DNA Web App — Supabase Schema Inventory

> **Source:** static committed artifacts — `src/integrations/supabase/types.ts` (auto-generated from the live DB), plus `supabase/migrations/*.sql` and `docs/DNA-SUPABASE-SCHEMA-EXPORT.md`.
> **NOT a live `information_schema` query — may drift from production.**

Conventions:
- All `id` columns are `uuid` PKs with `gen_random_uuid()` default unless noted.
- All tables live in the `public` schema unless noted.
- Postgres types inferred from TypeScript types in `types.ts`: `string` → `text` / `uuid` / `timestamptz` (disambiguated by column name); `number` → `int4` / `numeric` / `float8`; `boolean` → `bool`; `Json` → `jsonb`; `string[]` → `text[]`.
- "Nullable" reflects the `| null` marker in the `Row` type.
- "Default discoverable" reflects the `?` in the `Insert` type (column has a server default if it's optional on insert and not explicitly required).
- Foreign keys come from each table's `Relationships` block in `types.ts`. Where a relationship points to both `profiles` and the `public_profiles` view, only the canonical `profiles` link is listed.
- RLS policies cited only when the originating migration was located by grep. The hand-maintained schema export asserts RLS is enabled on **all 160+ tables**; the listed policies are representative, not exhaustive.

---

## Table of Contents

1. [Enums (Reference)](#1-enums-reference)
2. [Identity / Auth / Profiles](#2-identity--auth--profiles)
3. [Connections / Blocking / Introductions](#3-connections--blocking--introductions)
4. [Messaging](#4-messaging)
5. [Posts / Comments / Feed](#5-posts--comments--feed)
6. [Hashtags](#6-hashtags)
7. [Events](#7-events)
8. [Communities](#8-communities)
9. [Groups](#9-groups)
10. [Spaces / Tasks / Collaboration](#10-spaces--tasks--collaboration)
11. [CONTRIBUTE — Manifests / Stances / Needs / Fulfillments](#11-contribute--manifests--stances--needs--fulfillments)
12. [Opportunities / Organizations / Applications / Billing](#12-opportunities--organizations--applications--billing)
13. [DIA / ADIN](#13-dia--adin)
14. [ADA — Cohorts / Experiments](#14-ada--cohorts--experiments)
15. [Impact / Badges / DNA Points](#15-impact--badges--dna-points)
16. [Geography & Reference Data](#16-geography--reference-data)
17. [Notifications / Push / Newsletter](#17-notifications--push--newsletter)
18. [Admin / Moderation / Analytics](#18-admin--moderation--analytics)
19. [Feedback / Alpha / Beta](#19-feedback--alpha--beta)
20. [Advertising / Sponsorship](#20-advertising--sponsorship)
21. [Roadmap Subsystem](#21-roadmap-subsystem)
22. [Remittance Sub-domain](#22-remittance-sub-domain)
23. [Search Vectors / Recommendations / Engagement](#23-search-vectors--recommendations--engagement)
24. [Misc / Legacy](#24-misc--legacy)
25. [Views](#25-views)
26. [Appendix A — D054-relevant tables that DO NOT exist yet](#appendix-a)
27. [Appendix B — Tables with continent/country/location fields](#appendix-b)
28. [Appendix C — Storage Buckets](#appendix-c)

---

## 1. Enums (Reference)

Discovered in `types.ts` (L14783-14895) and the schema export doc:

| Enum | Values |
|---|---|
| `ad_campaign_status` | draft, pending_review, active, paused, ended, rejected |
| `advertiser_status` | pending, approved, suspended, rejected |
| `advertiser_tier` | starter, growth, scale |
| `app_role` | user, moderator, admin |
| `application_status` | pending, shortlisted, reviewing, accepted, rejected, withdrawn |
| `attachment_type` | space, task, update |
| `brief_interaction_type` | viewed, clicked, dismissed, not_interested, saved, why_this_opened |
| `contribution_currency` | expertise, network, resources, capital |
| `contribution_need_priority` | normal, high |
| `contribution_need_status` | open, in_progress, fulfilled, closed |
| `contribution_need_type` | funding, skills, time, access, resources |
| `contribution_offer_status` | pending, accepted, declined, completed |
| `contribution_type` | time, expertise, network, capital |
| `event_format` | in_person, virtual, hybrid |
| `event_type` | conference, workshop, meetup, webinar, networking, social, other |
| `group_join_policy` | open, approval_required, invite_only |
| `group_member_role` | owner, admin, moderator, member |
| `group_privacy` | public, private, secret |
| `hashtag_status` | active, archived, suspended, reserved |
| `hashtag_type` | community, personal |
| `linked_entity_type` | event, space, need, story, community_post |
| `match_kind` | their_stance_my_need, their_need_my_stance, mutual, tag_affinity |
| `module_status_state` | live, in_design, in_beta, coming_soon |
| `need_scope` | one_off, few_hours, short_project, extended, open_ended |
| `need_status` | draft, open, matched, fulfilled, closed, expired |
| `opportunity_status` | draft, active, paused, closed, archived |
| `opportunity_visibility` | public, network_only, private |
| `reasoning_source` | sql, dia |
| `reserved_category` | country, public_figure, company, government, offensive, system, trademark |
| `rsvp_status` | going, maybe, not_going, pending, waitlist |
| `space_update_type` | manual_update, milestone, auto_task_event |
| `stance_availability` | open_ongoing, monthly_hours, quarterly, project_based, limited_capacity |
| `stance_visibility` | public, connections_only, private |
| `task_status` | open, in_progress, done |
| `user_report_reason` | spam, harassment, impersonation, inappropriate_content, other |
| `user_report_status` | open, reviewing, resolved, dismissed |
| `verification_status` | pending_verification, soft_verified, fully_verified *(schema export doc also lists `unverified` and `rejected`; types.ts has only the three above — doc may pre-date a narrowing)* |

---

## 2. Identity / Auth / Profiles

### `profiles` (central table — every column from `types.ts` L7804-8482)

Primary key: `id` (also FK to `auth.users(id)` per migration `20250628212148-3c308b6c-...`).

| Column | Type | Nullable | Default discoverable | Notes |
|---|---|---|---|---|
| id | uuid | NO | — (required) | PK; FK → auth.users |
| username | text | NO | — (required) | unique (per migration history) |
| email | text | YES | — | |
| full_name | text | YES | — | |
| first_name | text | YES | — | |
| last_name | text | YES | — | |
| middle_initial | text | YES | — | |
| display_name | text | YES | — | |
| pronouns | text | YES | — | |
| avatar_url | text | YES | — | |
| avatar_position | jsonb | YES | — | |
| profile_picture_url | text | YES | — | |
| banner_url | text | YES | — | |
| banner_gradient | text | YES | — | |
| banner_overlay | bool | YES | YES | |
| banner_type | text | YES | — | |
| bio | text | YES | — | |
| headline | text | YES | — | |
| intro_text | text | YES | — | |
| intro_audio_url | text | YES | — | |
| intro_video_url | text | YES | — | |
| my_dna_statement | text | YES | — | |
| diaspora_story | text | YES | — | |
| achievements | text | YES | — | |
| certifications | text | YES | — | |
| education | text | YES | — | |
| professional_role | text | YES | — | |
| professional_summary | text | YES | — | |
| profession | text | YES | — | |
| company | text | YES | — | |
| organization | text | YES | — | |
| organization_name | text | YES | — | |
| organization_category | text | YES | — | |
| venture_name | text | YES | — | |
| venture_stage | text | YES | — | |
| fundraising_status | text | YES | — | |
| industry | text | YES | — | |
| industries | text[] | YES | — | |
| industry_sectors | text[] | YES | — | |
| sectors | text[] | YES | — | |
| professional_sectors | text[] | YES | — | |
| years_experience | int4 | YES | — | |
| years_of_experience | int4 | YES | — | duplicate of `years_experience` |
| years_in_diaspora | int4 | YES | — | |
| years_in_diaspora_text | text | YES | — | |
| africa_visit_frequency | text | YES | — | |
| **Location / Geography (heavy duplication)** | | | | |
| location | text | YES | — | |
| current_location | text | YES | — | |
| current_city | text | YES | — | |
| city | text | YES | — | |
| current_region | text | YES | — | |
| current_country | text | YES | — | |
| current_country_code | text | YES | — | |
| current_country_name | text | YES | — | |
| current_country_id | uuid | YES | — | FK → countries(id) |
| country_of_origin | text | YES | — | |
| country_of_origin_id | uuid | YES | — | FK → countries(id) |
| country_origin | text | YES | — | duplicate-ish |
| origin_country_code | text | YES | — | |
| origin_country_name | text | YES | — | |
| diaspora_origin | text | YES | — | |
| diaspora_status | text | YES | — | |
| diaspora_networks | text[] | YES | — | |
| ethnic_heritage | text[] | YES | — | |
| location_preference | text | YES | — | |
| timezone | text | YES | — | |
| phone | text | YES | — | |
| phone_number | text | YES | — | |
| whatsapp_number | text | YES | — | |
| contact_number_visibility | text | NO | YES | non-null with default |
| preferred_contact | text | YES | — | |
| preferred_contact_method | text | YES | — | |
| **Tags / Arrays / Interests** | | | | |
| advocacy_interests | text[] | YES | — | |
| africa_focus_areas | text[] | YES | — | |
| african_causes | text[] | YES | — | |
| focus_areas | text[] | YES | — | |
| impact_areas | text[] | YES | — | |
| impact_regions | text[] | YES | — | |
| impact_goals | text[] | YES | — | |
| sdg_focus | text[] | YES | — | |
| interests | text[] | YES | — | |
| interest_tags | text[] | YES | — | |
| skills | text[] | YES | — | |
| skills_offered | text[] | YES | — | |
| skills_needed | text[] | YES | — | |
| languages | text[] | YES | — | |
| networking_goals | text[] | YES | — | |
| mentorship_areas | text[] | YES | — | |
| mentorship_interest | text[] | YES | — | |
| collaboration_needs | text[] | YES | — | |
| contribution_types | text[] | YES | — | |
| engagement_intentions | text[] | YES | — | |
| intentions | text[] | YES | — | |
| intents | text[] | YES | — | |
| support_areas | text[] | YES | — | |
| selected_pillars | text[] | YES | — | |
| offers | text[] | YES | — | |
| needs | text[] | YES | — | |
| available_for | text[] | YES | — | |
| what_to_give | text[] | YES | — | |
| what_to_receive | text[] | YES | — | |
| regional_expertise | text[] | YES | — | |
| recent_searches | text[] | YES | — | |
| roles | text[] | YES | — | |
| beta_features_tested | text[] | YES | — | |
| **JSONB tag bundles** | | | | |
| availability_tags | jsonb | YES | — | |
| collaboration_tags | jsonb | YES | — | |
| contribution_tags | jsonb | YES | — | |
| diaspora_tags | jsonb | YES | — | |
| event_interest_tags | jsonb | YES | — | |
| intent_tags | jsonb | YES | — | |
| language_tags | jsonb | YES | — | |
| region_tags | jsonb | YES | — | |
| sector_tags | jsonb | YES | — | |
| skill_tags | jsonb | YES | — | |
| pinned_activity_ids | jsonb | YES | — | |
| hidden_activity_ids | jsonb | YES | — | |
| username_history | jsonb | YES | — | |
| beta_signup_data | jsonb | YES | — | |
| impact_scores | jsonb | YES | — | |
| notification_preferences | jsonb | YES | — | |
| profile_visibility_settings | jsonb | YES | — | |
| visibility | jsonb | YES | — | |
| onboarding_progress | jsonb | NO | YES | non-null with default |
| **Roles / Status / Flags** | | | | |
| user_role | text | YES | — | free-text; not the D054 role layer |
| user_type | text | YES | — | default `'member'` per schema export |
| is_admin | bool | YES | — | likely deprecated; prefer `user_roles` table |
| is_public | bool | YES | — | default `true` per schema export |
| is_beta_tester | bool | YES | — | |
| is_test_account | bool | YES | — | |
| verified | bool | YES | — | |
| verified_at | timestamptz | YES | — | |
| verification_status | `verification_status` (enum) | YES | — | |
| verification_method | text | YES | — | |
| verification_updated_at | timestamptz | YES | — | |
| beta_status | text | YES | — | |
| beta_phase | text | YES | — | |
| beta_expires_at | timestamptz | YES | — | |
| beta_feedback_count | int4 | YES | — | |
| **Onboarding / Tour** | | | | |
| onboarding_completed | bool | YES | — | |
| onboarding_completed_at | timestamptz | YES | — | (used by `OnboardingGuard`) |
| onboarding_stage | text | YES | — | |
| onboarding_recommendations_viewed | bool | YES | — | |
| tour_completed_at | timestamptz | YES | — | |
| tour_current_step | int4 | YES | — | |
| tour_last_shown_at | timestamptz | YES | — | |
| tour_skipped_at | timestamptz | YES | — | |
| first_action_completed | bool | YES | — | |
| first_action_type | text | YES | — | |
| **Preferences / Consents** | | | | |
| account_visibility | text | YES | — | |
| availability_for_mentoring | bool | YES | — | |
| availability_hours_per_month | int4 | YES | — | |
| available_hours_per_month | int4 | YES | — | |
| availability_visible | bool | YES | — | |
| mentorship_offering | bool | YES | — | |
| seeking_mentorship | bool | YES | — | |
| open_to_opportunities | bool | YES | — | |
| looking_for_opportunities | bool | YES | — | |
| agrees_to_values | bool | YES | — | |
| allow_profile_sharing | bool | YES | — | |
| auto_connect_enabled | bool | YES | — | |
| consent_event_invites | bool | YES | — | |
| consent_marketing_emails | bool | YES | — | |
| consent_partner_intros | bool | YES | — | |
| consent_public_search | bool | YES | — | |
| email_notifications | bool | YES | — | |
| email_visible | bool | YES | — | |
| newsletter_emails | bool | YES | — | |
| notifications_enabled | bool | YES | — | |
| show_presence | bool | NO | YES | non-null |
| show_read_receipts | bool | NO | YES | non-null |
| dashboard_version | text | YES | — | |
| **Counters / Scores** | | | | |
| connection_count | int4 | YES | — | |
| follower_count | int4 | YES | — | |
| following_count | int4 | YES | — | |
| profile_views_count | int4 | YES | — | |
| profile_completeness_score | int4 | YES | — | |
| profile_completion_percentage | int4 | YES | — | |
| profile_completion_score | int4 | YES | — | three competing completion fields |
| impact_scores_updated_at | timestamptz | YES | — | |
| **Username change tracking (4 redundant fields)** | | | | |
| username_change_count | int4 | YES | — | |
| username_changes | int4 | YES | — | |
| username_changes_count | int4 | YES | — | |
| username_changes_left | int4 | YES | — | |
| **Referrals** | | | | |
| referral_code | text | YES | — | |
| referrer_id | uuid | YES | — | FK → profiles(id) (self-ref) |
| **DIA/ADIN state** | | | | |
| adin_mode | text | YES | — | |
| adin_prompt_status | text | YES | — | |
| dia_insight | text | YES | — | |
| dia_insight_updated_at | timestamptz | YES | — | |
| **Social links** | | | | |
| linkedin_url | text | YES | — | |
| twitter_url | text | YES | — | |
| twitter_handle | text | YES | — | |
| facebook_url | text | YES | — | |
| instagram_url | text | YES | — | |
| github_url | text | YES | — | |
| website_url | text | YES | — | |
| **Free-text narrative fields** | | | | |
| community_involvement | text | YES | — | |
| contribution_style | text | YES | — | |
| giving_back_initiatives | text | YES | — | |
| home_country_projects | text | YES | — | |
| innovation_pathways | text | YES | — | |
| past_contributions | text | YES | — | |
| return_intentions | text | YES | — | |
| volunteer_experience | text | YES | — | |
| why_contribute | text | YES | — | |
| **Timestamps** | | | | |
| created_at | timestamptz | NO | YES | `now()` default |
| updated_at | timestamptz | NO | YES | `now()` default |
| last_active | timestamptz | YES | — | |
| last_active_at | timestamptz | YES | — | |
| last_seen_at | timestamptz | YES | — | |
| deleted_at | timestamptz | YES | — | soft-delete marker |

**Foreign keys:**
- `country_of_origin_id` → `countries(id)`
- `current_country_id` → `countries(id)`
- `referrer_id` → `profiles(id)` (self-ref)
- Implicit: `id` → `auth.users(id) ON DELETE CASCADE` (from `20250628212148-...sql`)

**RLS policies (from `20250628212148-3c308b6c-22ee-4529-be59-752111541133.sql` and `20250703034619-5b104a26-...sql`):**
- `Public profiles are viewable by everyone` — `SELECT USING (is_public = true OR auth.uid() = id)`
- `Users can insert their own profile` — `INSERT WITH CHECK (auth.uid() = id)`
- `Users can update their own profile` — `UPDATE USING (auth.uid() = id)`
- Earlier variant (in `20250610215537-...sql`): `Users can view public profiles` — same predicate, `(select auth.uid())` form.

**Triggers:** `handle_new_user()` (SECURITY DEFINER) on `auth.users` AFTER INSERT — auto-creates a `profiles` row with `id`, `email`, `full_name` from `raw_user_meta_data`.

---

### `user_roles` (types.ts L11630)

PK: `id`. FK to `auth.users` via `user_id`. Created in `20250614193556-a1d9fe35-...sql`.

| Column | Type | Nullable | Default discoverable |
|---|---|---|---|
| id | uuid | NO | YES |
| user_id | uuid | NO | — (FK → profiles(id)) |
| role | `app_role` (enum) | NO | YES |
| granted_at | timestamptz | YES | — |
| granted_by | uuid | YES | — (FK → profiles(id)) |

**Unique:** `(user_id, role)`.

**RLS (from `20251011053607_36ee9b34-...sql`):**
- `user_roles_view` — `SELECT USING ((SELECT auth.uid()) = user_id OR has_role((SELECT auth.uid()), 'admin'::app_role))`
- `user_roles_admin` — `FOR ALL USING (has_role((SELECT auth.uid()), 'admin'::app_role))`

**Security-definer helper (from `20250614193556-...sql`):**
```sql
CREATE FUNCTION has_role(_user_id uuid, _role app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
```

> **D054 note:** `app_role` is an RBAC/permission enum (`user`, `moderator`, `admin`). The D054 identity-role layer (`returnee`, `anchor`, `ally`, `exploring`) is a separate concept and should not reuse this enum.

---

### `users` (legacy mini-profile, types.ts L11749)

PK: `id`. No FKs declared.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | (required on insert) |
| email | text | YES | — |
| full_name | text | YES | — |
| username | text | YES | — |
| avatar_url | text | YES | — |
| bio | text | YES | — |
| location | text | YES | — |
| origin_country | text | YES | — |
| languages | text[] | YES | — |
| causes | text[] | YES | — |
| diaspora_tags | text[] | YES | — |
| role | text | NO | — |
| created_at | timestamptz | YES | YES (`now()`) |
| updated_at | timestamptz | YES | YES (`now()`) |

> Legacy. Schema export marks this as "prefer profiles". Still referenced by `communities.created_by`, `user_communities.owner_id`.

---

### `verified_contributors` (types.ts L11800)

PK: `id`. FK: `user_id` → `profiles(id)`.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | YES |
| user_id | uuid | YES | — |
| verification_source | text | NO | — |
| verified_at | timestamptz | YES | — |
| expires_at | timestamptz | YES | — |
| notes | text | YES | — |

---

### `username_history` (types.ts L11710)

PK: `id`. FK: `user_id` → `profiles(id)`.

Columns: `user_id`, `old_username`, `new_username`, `changed_at`.

---

### `profile_completion` (types.ts L7710)

PK: `user_id`. Columns: `steps_completed text[]`, `guide_dismissed bool`, `guide_minimized bool`, `completed_at`, `updated_at`.

### `profile_views` (types.ts L7777)
`id` PK; `viewer_id`, `profile_id`, `viewed_at`, `view_type`, `metadata jsonb`.

### `profile_causes` (types.ts L7670)
Junction (`profile_id`, `cause_id`, `created_at`). FKs to `profiles`, `causes`.

### `profile_skills` (types.ts L7737)
Junction (`profile_id`, `skill_id`, `created_at`). FKs to `profiles`, `skills`.

### `causes` (types.ts L1019), `skills` (types.ts L10380)
Simple reference tables: `id`, `name`, `description`/`category`, `icon`, `created_at`.

### Witness / Affirmation / Declaration-like tables — finding

Grep across all 753 migrations for the keywords **witness**, **affirmation** returned **zero** matches. A "declaration" concept exists but is concentrated in:
- `need_declarations` (§11) — a user's active, time-bound declaration of what they are building and seeking.
- `contribution_manifests` + `currency_stances` (§11) — the durable "I declare how I show up" model.

If a planned Witness/Affirmation system exists in product specs, **it has not been migrated into the database yet**.

---

## 3. Connections / Blocking / Introductions

### `connections` (types.ts L1525)

PK: `id`. FKs: `requester_id`, `recipient_id` → `profiles(id)`.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | YES |
| requester_id | uuid | NO | — |
| recipient_id | uuid | NO | — |
| status | text | NO | — |
| message | text | YES | — |
| created_at | timestamptz | NO | YES |
| updated_at | timestamptz | NO | YES |

### `blocked_users` (types.ts L995)
`id`, `blocker_id`, `blocked_id`, `reason`, `created_at`. No FKs declared.

### `user_blocks` (types.ts L11157)
Duplicate of `blocked_users` with `blocker_id`, `blocked_id`, `created_at`. No FKs.

### `user_connections` (types.ts L11222)
Follower-style; `follower_id`, `following_id`, `created_at`. No FKs.

### `user_follows` (types.ts L11396)
`follower_id`, `followed_id`, `created_at`. No FKs. (Yet another follow variant.)

### `introductions` (types.ts L5679)

PK: `id`. FKs to `profiles` (×3) and `conversations_new`.

Columns: `introducer_id`, `person_a_id`, `person_b_id`, `intro_type`, `status` (`'pending'` default), `message`, `context jsonb`, `conversation_id` (FK → conversations_new).

---

## 4. Messaging

### `conversations` (legacy 1:1 DMs, types.ts L2136)

PK: `id`. No FKs declared.

Columns: `user_a`, `user_b`, `bucket_for_a/b`, `is_archived_by_a/b`, `is_muted_by_a/b`, `is_pinned_by_a/b`, `deleted_by_a/b`, `disappearing_seconds`, `last_message_at`, `last_summarised_message_id`, `summary_payload jsonb`, `created_at`.

### `conversations_new` (unified, types.ts L2199)

PK: `id`. FK: `created_by` → `profiles(id)`.

Columns: `conversation_type` (`'direct'` default), `title`, `description`, `avatar_url`, `created_by`, `origin_type`, `origin_id`, `metadata jsonb`, `last_message_at`, `created_at`, `updated_at`.

### `conversation_participants` (types.ts L2092)

PK: `id`. FK: `conversation_id` → `conversations_new(id)`.

Columns: `conversation_id`, `user_id`, `role`, `joined_at`, `last_read_at`, `is_archived`, `is_muted`, `is_pinned`.

### `messages` (legacy, types.ts L5926)

PK: `id`. FKs: `conversation_id` → `conversations(id)`, `forwarded_from_message_id` → `messages(id)`.

Columns: `conversation_id`, `sender_id`, `content`, `client_id`, `payload jsonb`, `read`, `edited_at`, `deleted_at`, `forwarded_from_message_id`, `created_at`.

### `messages_new` (unified, types.ts L5983)

PK: `id`. FKs: `conversation_id` → `conversations_new`, `forwarded_from_message_id` and `reply_to_id` → `messages_new`.

Columns: `conversation_id`, `sender_id`, `content`, `message_type`, `client_id`, `payload jsonb`, `media_urls jsonb`, `reply_to_id`, `forwarded_from_message_id`, `edited_at`, `deleted_at`, `is_deleted`, `created_at`, `updated_at`.

### Other messaging tables

- **`message_reactions`** (L5867) — `id`, `message_id`, `user_id`, `reaction`, `created_at`. Unique `(message_id, user_id, reaction)` per schema export.
- **`message_receipts`** (L5891) — `message_id`, `user_id`, `conversation_id`, `delivered_at`, `read_at`, `created_at`. FK to `messages(id)`.
- **`message_mentions`** (L5807) — `id`, `message_id`, `mentioned_user_id`, `conversation_id`. FKs to `messages`, `conversations`.
- **`message_rate_log`** (L5846) — rate-limit log; bigint `id`, `sender_id`, `conversation_id`, `created_at`.
- **`starred_messages`** (L10985) — `id`, `user_id`, `message_id`, `conversation_id`. FK to `messages`.

### Group messaging (separate from communities)

`group_conversations` (L4686), `group_messages` (L4837), `group_message_mentions` (L4798), `group_starred_messages` (L5003), `group_members` (L4751, uses `group_member_role` enum), `group_join_requests` (L4710).

---

## 5. Posts / Comments / Feed

### `posts` (types.ts L7511)

PK: `id`. FKs: `event_id` → `events`, `original_post_id` → `posts` (self-ref), `shared_by` → `profiles`, `space_id` → `collaboration_spaces` (legacy table).

Notable columns: `author_id`, `content`, `title`, `subtitle`, `slug`, `post_type`, `story_type`, `privacy_level`, `comments_disabled`, `is_deleted`, `is_featured`, `pinned_at`, `image_url`, `gallery_urls text[]`, `link_url/title/description`, `link_metadata jsonb`, `event_id`, `space_id`, `linked_entity_id`, `linked_entity_type`, `original_post_id` (reshares), `shared_by`, `share_commentary`, `tags text[]`, `metadata jsonb`, `moderation_status/notes`, `moderated_at/by`, `flag_reason`, `flagged_at/by`, `view_count`, `created_at`, `updated_at`.

**RLS (from `20250628212148-...sql`):**
- `Published posts are viewable by everyone` — `SELECT USING (is_published = true)` *(targets an old `is_published` column from the initial table; current `posts` uses `privacy_level` and `is_deleted` — policy likely re-defined in a later migration)*
- `Users can insert/update/delete their own posts` — `auth.uid() = user_id` *(original column was `user_id`; current is `author_id` — policies likely re-written)*

### `post_comments` (types.ts L7228)

PK: `id`. FKs: `parent_comment_id` → `post_comments`, `post_id` → `posts`, `user_id` → `profiles`.

Columns: `post_id`, `user_id`, `content`, `parent_comment_id` (threaded), `is_deleted`, moderation fields, `created_at`, `updated_at`.

### `comments` (alternate/legacy, types.ts L1188)
PK: `id`. FKs: `author_id` → `profiles`, `parent_id` → `comments` (self). `post_id` nullable, **no FK** (entity-agnostic).

### `comment_reactions` (L1112)
`id`, `comment_id` (FK→post_comments), `user_id`, `emoji`, `created_at`.

### `comment_reports` (L1144)
`id`, `comment_id` (FK→post_comments), `reporter_id`, `reason`, `description`, `status`, `reviewed_at/by`, `created_at`.

### `post_likes` (L7332)
`id`, `post_id` (FK→posts), `user_id`, `created_at`.

### `post_reactions` (L7361)
`id`, `post_id`, `user_id` (FKs), `emoji`, `created_at`.

### `post_bookmarks` (L7179)
`id`, `post_id` (FK), `user_id` (FK), `folder`, `pinned_at`, `created_at`.

### `post_hashtags` (L7311)
Junction; `id`, `post_id`, `hashtag_id`, `created_at`. (FKs not declared in types.)

### `post_shares` (L7451)
`id`, `post_id`, `user_id`, `share_commentary`, `created_at`. No FKs.

### `post_views` (L7475)
`id`, `post_id`, `viewer_id` (FK→profiles), `viewed_at`.

### `post_reports` (L7407)
`id`, `post_id` (FK), `reporter_id`, `reason`, `description`, `status`, `reviewed_at/by`, `created_at`.

### `post_analytics` (L7131)
Denormalized event log: `post_id`, `viewer_id`, `user_id`, `event_type`, `engaged`, `engagement_type`, `view_duration`, `count`, `event_date`, `metadata`, `viewed_at`, `created_at`. No FKs declared.

### `feed_*` tables
`feed_bookmarks` (L4198), `feed_comments` (L4222), `feed_engagement_events` (L4263), `feed_reactions` (L4305), `feed_research_responses` (L4332), `feed_reshares` (L4404).

### `hidden_posts` (L5333), `muted_authors` (L6208), `saved_posts` (L10278)
Per-user filtering tables.

### `trend_follows` (L11044)
`id`, `user_id` (FK→profiles), `hashtag` (text, not FK), `followed_at`.

---

## 6. Hashtags

### `hashtags` (types.ts L5261)

PK: `id`. FK: `owner_id` → `profiles(id)`.

Columns: `tag`, `description`, `type` (`hashtag_type` enum), `status` (`hashtag_status` enum), `owner_id`, `is_personal`, `is_verified`, `requires_approval`, `usage_count`, `follower_count`, `first_used_at`, `last_used_at`, `archived_at`, `created_at`, `updated_at`.

### `hashtag_analytics` (L5098)
`hashtag_id` (FK), `date`, `usage_count`, `unique_users`, `engagement_count`, `follower_change`, `created_at`.

### `hashtag_followers` (L5139)
`id`, `hashtag_id` (FK), `user_id` (FK→profiles), `created_at`.

### `hashtag_usage_requests` (L5182)
`id`, `hashtag_id`, `post_id`, `requester_id`, `owner_id`, `status`, `review_note`, `reviewed_at`, `created_at`. (FKs to hashtags, posts, profiles ×2.)

### `reserved_hashtags` (L9376) — protected names.

---

## 7. Events

### `events` (types.ts L3911)

PK: `id`. FK: `group_id` → `groups(id)`.

Notable columns: `organizer_id` (nullable for curated), `title`, `subtitle`, `description`, `short_description`, `slug`, `event_type` (enum), `format` (enum), `start_time`, `end_time`, `timezone`, `location_name/address/city/country/lat/lng`, `meeting_url`, `meeting_platform`, `cover_image_url`, `max_attendees`, `allow_guests`, `requires_approval`, `is_public`, `is_published`, `is_cancelled`, `is_curated`, `is_flagship`, `curated_at/source/source_url`, `cancellation_reason`, `dress_code`, `agenda jsonb`, `speakers jsonb`, `tags text[]`, `status`, `visibility`, `group_id`, `created_at`, `updated_at`.

### Related event tables

| Table | Notes |
|---|---|
| `event_attendees` (L3232) | `event_id`, `user_id`, `status` (`rsvp_status` enum), `checked_in`, `checked_in_at`, `qr_code_token`, `guest_name`, `response_note`, `source` |
| `event_registrations` (L3481) | `event_id`, `user_id`, `ticket_type_id`, `status`, `answers jsonb`, `join_token`, `price_paid_cents`, `currency`, `stripe_*`. FKs point to legacy `events_old`. |
| `event_checkins` (L3323) | `registration_id` (FK→event_registrations), `by_profile_id`, `checked_in_at` |
| `event_ticket_types` (L3761) | `name`, `price_cents`, etc. FK → `events_old`. |
| `event_tickets` (L3820) | FK → `events`. |
| `event_ticket_holds` (L3702) | reservation holds; FKs to events_old, event_ticket_types, profiles |
| `event_promo_codes` (L3390) | FK → events |
| `event_registration_questions` (L3440) | FK → events_old |
| `event_waitlist` (L3879) | FK → events_old |
| `event_blasts` (L3285) | FK → events_old |
| `event_reminder_logs` (L3547) | event_id, user_id, reminder_type, notification_id (FK→notifications), sent_at |
| `event_reports` (L3592) | event_id, reported_by, reason, description, status, reviewed_by/at |
| `event_roles` (L3664) | event_id, user_id, role, permissions jsonb. Unique (event_id, user_id) |
| `event_comments` (L3352) | event_id, author_id, content, is_deleted |
| `event_analytics` (L3200) | FK → events_old |
| `events_log` (L4054) | event_type, payload, created_at — audit log |
| `events_old` (L4078) | legacy events table (still referenced by many FK indices) |

---

## 8. Communities

### `communities` (types.ts L1243)

PK: `id`. FK: `created_by` → `users(id)` (legacy `users`, not `profiles`).

Columns: `name`, `description`, `category`, `image_url`, `cover_image_url`, `tags text[]`, `created_by`, `member_count`, `is_active`, `is_featured`, moderation fields, `purpose_goals`, `created_at`, `updated_at`.

### Related community tables

| Table | Key cols |
|---|---|
| `community_memberships` (L1414) | community_id (FK), user_id, role, status, requested_at, approved_at, approved_by, joined_at |
| `community_posts` (L1458) | community_id (FK), author_id (FK→profiles), content, title, post_type, media_url, is_pinned, event_date, event_location |
| `community_events` (L1349) | community_id (FK), created_by, title, description, event_date, end_date, location, is_virtual, max_attendees, registration_required, registration_url, status, image_url |
| `community_event_attendees` (L1317) | event_id (FK→community_events), user_id, status, registered_at |

---

## 9. Groups

### `groups` (types.ts L5035)

PK: `id`. No FKs declared in types.ts (`created_by` is uuid but not in Relationships).

Columns: `created_by`, `name`, `slug`, `description`, `category`, `location`, `avatar_url`, `cover_image_url`, `tags text[]`, `privacy` (`group_privacy` enum), `join_policy` (`group_join_policy` enum), `is_active`, `member_count`, `post_count`, `search_vector` (tsvector), `created_at`, `updated_at`.

Plus: `group_members`, `group_messages`, `group_conversations`, `group_join_requests`, `group_post_comments`, `group_post_likes`, `group_posts`, `group_starred_messages`, `group_message_mentions` (see types.ts L4710-5003).

---

## 10. Spaces / Tasks / Collaboration

### `spaces` (types.ts L10772)

PK: `id`. FKs: `origin_event_id` → `events`, `origin_group_id` → `groups`, `template_id` → `space_templates`.

Notable columns: `created_by`, `name`, `slug`, `description`, `tagline`, `cover_image_url`, `space_type`, `status`, `visibility`, `privacy_level`, `region`, `focus_areas text[]`, `health_score`, `health_updated_at`, `stall_threshold_days`, `last_activity_at`, `completion_summary jsonb`, `contributor_stats jsonb`, `origin_event_id`, `origin_group_id`, `source_id`, `source_type`, `template_id`, `created_at`, `updated_at`.

### `space_members` (types.ts L10489)
`id` (unusually nullable in types — no PK constraint surfaced). FKs: `role_id` → `space_roles`, `space_id` → `spaces`. Columns: `space_id`, `user_id`, `role`, `role_id`, `status`, `invited_by`, `joined_at`.

### `space_tasks` (types.ts L10614)
PK: `id`. FKs: `parent_task_id` → `space_tasks` (self), `space_id` → `spaces`. Uses `task_status` enum. Columns: `space_id`, `created_by`, `assigned_to`, `assignee_id`, `parent_task_id`, `title`, `description`, `status`, `priority`, `sort_order`, `due_date`, `completed_at`, `last_nudge_at`, `nudge_count`, `tags text[]`, `created_at`, `updated_at`.

### Other space tables

| Table | Notes |
|---|---|
| `space_roles` (L10537) | space_id, title, description, is_lead, order_index, permissions jsonb, required_skills |
| `space_task_dependencies` (L10581) | task_id, depends_on_task_id (both FK→space_tasks) |
| `space_attachments` (L10442) | space_id, attached_to_id, attached_to_type (`attachment_type` enum), file_name/size/type/url, uploaded_by |
| `space_updates` (L10737) | space_id (FK), created_by, content, type (`space_update_type` enum) |
| `space_activity_log` (L10401) | space_id (FK), user_id, action_type, entity_type/id, metadata |
| `space_templates` (L10692) | name, category, default_roles, default_initiatives, suggested_milestones, tier_availability |
| `collaboration_spaces` (L1073) | legacy spaces — created_by, title, description, image_url, status, visibility, tags |
| `collaboration_memberships` (L1046) | legacy member junction — space_id, user_id, role, status |
| `task_comments` (L11017) | task_id, space_id, author_id, body |
| `initiatives` (L5548) | space_id (FK), creator_id, title, description, status, impact_area, started_at, target_date, completed_at, completion_metrics |
| `milestones` (L6059) | space_id, initiative_id (FK), created_by, title, description, status, target_date, due_date, completion_date, order_index, celebration_shared |

---

## 11. CONTRIBUTE — Manifests / Stances / Needs / Fulfillments

### `contribution_manifests` (types.ts L1940; created in `20260512030011_70a37c09-...sql`)

PK: `id`. **Unique**: `user_id`. FK (per migration): `user_id` → `auth.users(id) ON DELETE CASCADE`.

Columns: `user_id` (unique), `headline`, `is_published bool DEFAULT false`, `last_reviewed_at`, `created_at`, `updated_at`.

**RLS:**
- `Published manifests are visible to authenticated users` — SELECT to authenticated USING `is_published = true`
- `Users can read their own manifest` — SELECT USING `user_id = auth.uid()`
- `Users can insert/update/delete their own manifest` — `user_id = auth.uid()`

### `currency_stances` (types.ts L2402)

PK: `id`. FK: `manifest_id` → `contribution_manifests`. Also `user_id` → `auth.users(id)`. Unique: `(user_id, currency, title, is_archived)` with nulls-not-distinct.

Columns: `manifest_id`, `user_id`, `currency` (`contribution_currency` enum), `title` (4-120 chars), `description` (≤600), `tags text[]` (max 8), `availability` (enum, default `open_ongoing`), `visibility` (enum, default `public`), `display_order smallint`, `is_archived bool DEFAULT false`, `archived_at`, `created_at`, `updated_at`.

**Constraints:**
- `unique_active_stance_title` — `UNIQUE NULLS NOT DISTINCT (user_id, currency, title, is_archived)`
- `capital_deferred_v1` — `CHECK (currency != 'capital')` (UI-disabled in v1)
- Trigger `enforce_active_stance_cap` — max 5 active stances per manifest.

### `need_declarations` (types.ts L6229; created in `20260512150807_f3f39084-...sql`)

PK: `id`. FK: `related_stance_id` → `currency_stances`. Also `user_id` → `auth.users(id)`.

Columns: `user_id`, `title`, `context`, `currency` (`contribution_currency` enum), `scope` (`need_scope` enum, default `one_off`), `status` (`need_status` enum, default `draft`), `visibility` (`stance_visibility` enum, default `public`), `tags text[]`, `related_stance_id`, `starts_at`, `ends_at`, `expires_at`, `published_at`, `closed_at`, `created_at`, `updated_at`.

**RLS:**
- `Open public need declarations are visible to authenticated` — SELECT to authenticated
- `Open connections-only need declarations visible to connections` — SELECT joined on `connections` (requester/recipient matched with `auth.uid()` and `need_declarations.user_id`, status accepted)
- `Users can read/insert/update/delete their own need declarations` — `user_id = auth.uid()`

**Triggers:** `stamp_need_declaration_lifecycle()`, `enforce_active_need_declaration_cap()`.

### `need_fulfillments` (types.ts L6297)

PK: `id`. FKs: `need_id` → `need_declarations`, `room_curation_id` → `room_curations`.

Columns: `need_id`, `fulfiller_id`, `requester_id`, `status`, `thread_id`, `room_curation_id`, `fulfiller_message`, `confirmed_at`, `fulfilled_at`, `cancelled_at`, `cancelled_by`, `created_at`, `updated_at`.

### `contribution_acknowledgments` (types.ts L1724)

PK: `id`. FKs: `from_profile_id` and `to_profile_id` → `profiles`; `fulfillment_id` → `need_fulfillments`.

Columns: `from_profile_id`, `to_profile_id`, `fulfillment_id`, `message`, `rating int4`, `is_public bool`, `created_at`.

### `contribution_fulfillments` (types.ts L1859)
Older fulfillment table tied to opportunities. FKs: `contributor_id`, `poster_id` → `profiles`; `opportunity_id` → `opportunities`. `status`, `submission_notes`, `submission_attachments jsonb`, `revision_notes`, `completion_notes`, `completed_at`, `created_at`, `updated_at`.

### `contribution_needs` (legacy spaces-bound, types.ts L1970)
PK: `id`. FK: `space_id` → `spaces`. Uses `contribution_need_*` enums. Replaced by `need_declarations`.

### `contribution_offers` (types.ts L2038)
PK: `id`. FKs: `need_id` → `contribution_needs`, `space_id` → `spaces`. Uses `contribution_offer_status` enum.

### `contribution_cards` (legacy, types.ts L1793)
Earlier marketplace model.

### `room_curations` (types.ts L10189) — match-recommendation engine

PK: `id`. FKs: `subject_need_id` and `viewer_need_id` → `need_declarations`; `subject_stance_id` and `viewer_stance_id` → `currency_stances`.

Columns: `viewer_user_id`, `subject_user_id`, `currency`, `kind` (`match_kind` enum), `score`, `reasoning`, `reasoning_source` (`sql`|`dia`), `curation_date`, `dismissed_at`, `engaged_at`, `engaged_thread_id`.

---

## 12. Opportunities / Organizations / Applications / Billing

### `opportunities` (types.ts L6499)

PK: `id`. FK: `created_by` → `profiles`. Columns: `created_by`, `space_id`, `title`, `description`, `type`, `status`, `visibility`, `location`, `image_url`, `link`, `tags text[]`, `created_at`, `updated_at`.

> Schema export doc describes a richer `opportunities` shape (salary_min/max, opportunity_type, etc.) — types.ts shows the current simpler shape; rich fields may live in a separate table.

### `organizations` (types.ts L6924)

PK: `id`. FKs: `country_id` → `countries`, `owner_user_id` → `profiles`. Columns: `owner_user_id`, `name`, `slug`, `description`, `logo_url`, `website`, `country_id`, `annual_budget_usd`, `verified`, `verified_at`, `verification_status/submitted_at/approved_at/rejected_at/notes`, `verification_fee_paid`, `verification_documents_url`, `subscription_tier/status/started_at/ends_at`, `stripe_customer_id`, `stripe_subscription_id`, `opportunities_posted_this_year`, `year_reset_at`, `deleted_at`, `created_at`, `updated_at`.

### `applications` (types.ts L806)
PK: `id`. FKs: `opportunity_id` → `opportunities`, `user_id` → `profiles`. Columns: `user_id`, `opportunity_id`, `cover_letter`, `resume_url`, `status`, `applied_at`, `updated_at`.

### `opportunity_applications` (types.ts L6565)
Alternate model using `application_status` enum. FKs: `applicant_id`, `reviewed_by` → `profiles`; `opportunity_id` → `opportunities`. Columns: `applicant_id`, `cover_letter`, `proposed_contribution_type` (enum), `proposed_hours_per_month`, `status` (`application_status` enum), `status_updated_at`, `reviewed_by/at`, `review_notes`, `poster_notes`, `withdrawn_at`.

### Related contribute/opportunity tables
- `opportunity_bookmarks` (L6655) — `id`, `opportunity_id` (FK), `user_id` (FK)
- `opportunity_contributions` (L6698) — `application_id` (FK, 1:1), `contributor_id`, `opportunity_id`, `contribution_type`, `hours_contributed`, `verified_by/at/notes`
- `opportunity_interests` (L6792) — soft expression of interest
- `organization_verification_requests` (L6830) — full verification workflow
- `billing_transactions` (L942) — `organization_id` (FK), `type`, `amount_cents`, `currency`, `stripe_*`, `status`, `description`, `metadata`
- `platform_fees` (L7042) — `name`, `fee_type`, `value`, `min_amount`, `max_amount`, `applies_to`, `is_active`

---

## 13. DIA / ADIN

| Table | Key cols (PK `id`) |
|---|---|
| `dia_queries` (L2879) | `query_text`, `normalized_query`, `query_hash`, `perplexity_response jsonb`, `citations`, `network_matches`, `tokens_used`, `estimated_cost`, `model_used`, `cache_hits`, `expires_at`, `created_at` |
| `dia_query_log` (L2927) | `user_id`, `query_text`, `response_time_ms`, `cache_hit`, `source`, `created_at` |
| `dia_user_usage` (L2957) | `user_id`, `period_start`, `query_count`, `query_limit`, `total_tokens_used`, `total_estimated_cost`, `last_query_at` |
| `dia_insights` (L2660) | `title`, `description`, `query_prompt`, `category`, `region`, `display_order`, `is_featured`, `is_active`, `click_count`, `start_date/end_date` |
| `dia_brief_cards` (L2509) | `user_id` (FK→profiles), `brief_date`, `c_module`, `signal_type`, `signal_strength`, `position`, `title`, `body`, `cta_label`, `cta_route`, `reasoning`, `target_entity_id/type`, `expires_at`, `is_fallback` |
| `dia_brief_interactions` (L2584) | `card_id` (FK), `user_id` (FK), `interaction_type` (`brief_interaction_type` enum) |
| `dia_brief_snoozes` (L2630) | `user_id`, `thread_id`, `thread_type`, `snoozed_until` |
| `dia_nudges` (L2810) | `user_id`, `c_module`, `nudge_type`, `headline`, `body`, `action jsonb`, `payload jsonb`, `entity_id`, `entity_kind`, `priority`, `status`, `channel`, `seen_at`, `delivered_at`, `acted_on_at`, `dismissed_at`, `expires_at`, `emitted_at` |
| `dia_messaging_events` (L2711) | `user_id`, `conversation_id`, `event_type`, `model`, `variant`, `ref_id`, `metadata` |
| `dia_messaging_feedback` (L2747) | `user_id`, `conversation_id`, `surface`, `helpful bool`, `model`, `variant`, `ref_id` |
| `dia_messaging_prefs` (L2783) | `user_id` PK, `smart_replies_enabled`, `summaries_enabled`, `email_digest` |
| `adin_nudges` (L458) | `user_id`, `connection_id`, `nudge_type`, `message`, `payload`, `status`, `resolved_at` |
| `adin_preferences` (L494) | per-user email/notification prefs (15+ bool cols), quiet hours, `nudge_categories`, `unsubscribe_token` |
| `adin_recommendations` (L563) | `user_id`, `rec_type`, `score`, `payload`, `for_connection_id`, `expires_at` |
| `adin_signals` (L596) | `user_id` (FK→profiles), `signal_type`, `description`, `cta`, `link`, `signal_data`, `region_focus`, `sector_focus`, `seen`, `created_by` |
| `adin_contributor_requests` (L413) | `user_id`, `country_focus`, `description`, `impact_type`, `evidence_links`, `status`, `admin_notes`, `reviewed_by/at` |
| `user_adin_profile` (L11080) | `user_id`, `interests`, `skills`, `industries`, `engagement_pillars`, `is_verified_contributor`, `contributor_score`, `contributor_impact_type`, `contributor_verified_at`, `last_active` |

---

## 14. ADA — Cohorts / Experiments

| Table | Key cols |
|---|---|
| `ada_cohorts` (L213) | `name`, `description`, `criteria jsonb`, `is_active` |
| `ada_cohort_memberships` (L181) | `cohort_id` (FK), `user_id`, `computed_at`, `expires_at` |
| `ada_policies` (L377) | `name`, `description`, `type`, `scope`, `config jsonb`, `is_active` |
| `ada_experiments` (L327) | `name`, `description`, `target_policy_type`, `target_route`, `cohort_id` (FK), `status`, `start_at`, `end_at` |
| `ada_experiment_variants` (L282) | `experiment_id` (FK), `policy_id` (FK), `name`, `allocation` |
| `ada_experiment_assignments` (L243) | `experiment_id` (FK), `variant_id` (FK), `user_id`, `assigned_at` |

---

## 15. Impact / Badges / DNA Points

| Table | Key cols |
|---|---|
| `impact_log` (L5503) | `user_id`, `type`, `action_type`, `pillar`, `points`, `score`, `target_id/type`, `metadata`, `context` |
| `impact_badges` (L5470) | `badge_key`, `name`, `description`, `icon`, `criteria`, `active` |
| `impact_attributions` (L5440) | `connection_id`, `impact_type`, `metric jsonb`, `source_event_id`, `verified_by` |
| `badge_definitions` (L861) | `slug`, `name`, `description`, `category`, `tier`, `icon`, `criteria` |
| `user_badges` (L11128) | `user_id`, `badge_id` (FK→badge_definitions), `earned_at` |
| `user_dna_points` (L11282) | `user_id` PK, `connect_score`, `collaborate_score`, `contribute_score`, `total_score` |
| `user_engagement_tracking` (L11312) | `user_id`, `event_type`, `event_context`, `cohort`, `engagement_score`, `reminder_stage`, `last_active`, `last_post_created`, `last_connection_made`, `last_profile_update` |
| `skill_analytics` (L10326) | `user_id`, `skill_name`, `action_type`, `profile_updated_at` |
| `skill_connections` (L10353) | `user_a_id`, `user_b_id`, `shared_skills`, `connection_strength` |

---

## 16. Geography & Reference Data

### `continents` (L1700)
`id`, `name`, `description`.

### `regions` (L8656)
PK: `id`. FK: `continent_id` → `continents`. Notable: `name`, `region_code`, `region_slug`, `tagline`, `description`/`description_short`/`description_full`, `hero_image_url`, `map_coordinates jsonb`, `diaspora_population_estimate`, `key_sectors text[]`, `interest_tags text[]`, `skill_relevance text[]`, `languages_primary text[]`, `timezone_primary`, `status`, `created_at`, `updated_at`.

### `countries` (L2259)
PK: `id`. FK: `region_id` → `regions`. Notable: `name`, `country_code_iso2`/`iso3`, `iso_code`, `country_slug`, `capital`, `capital_coordinates jsonb`, `currency_code`, `official_languages text[]`, `timezone`, `population numeric`, `gdp_usd numeric`, `gdp_growth_rate`, `diaspora_population_estimate`, `diaspora_top_destinations text[]`, `key_sectors text[]`, `skill_relevance text[]`, `interest_tags text[]`, `flag_url`, `hero_image_url`, `tagline`, `description`/`description_short`/`description_full`, `status`, `created_at`, `updated_at`.

> **D054 relevance:** `countries` has `country_code_iso2`, `iso3`, and `iso_code` columns — these are the canonical ISO-3166 sources to validate/normalize the new `profiles.country` column against.

### `provinces` (L8564)
PK: `id`. FK: `country_id` → `countries`. Columns: `name`, `province_type`, `population`, `description`.

### `diaspora_data` (L2996)
Project records by `country_id` (FK). `project_name`, `project_type`, `diaspora_name/location`, `remittance_value`, `currency`, `story_title/content`, `year`, `featured`, `image_url`.

### `economic_indicators` (L3058)
`country_id`, `province_id`, `region_id` (all FK), `indicator_type`, `value`, `unit`, `year`, `month`, `source`.

### `innovation_data` (L5610)
`country_id`, `province_id` (FK), `name`, `organization_type`, `sector`, `founded_year`, `funding_amount`, `funding_currency`, `logo_url`, `website`, `featured`.

### `political_digest` (L7078)
`country_id` (FK NOT NULL), `report_date`, `title`, `summary`, `risk_level`, `elections_upcoming`, `policy_changes`, `reforms_highlight`, `author`.

### `geographic_relevance` (L4653)
Geo-relevance scoring (small table).

### `monthly_reports` (L6142)
`country_id` / `region_id` FKs; `report_year/month`, `is_published`, summaries.

---

## 17. Notifications / Push / Newsletter

### `notifications` (types.ts L6407)
PK: `id`. No FKs declared. Columns: `user_id`, `type`, `title`, `message`, `payload jsonb`, `link_url`, `read bool`, `is_read bool` (duplicate), `created_at`, `updated_at`.

### `nudges` (types.ts L6449)
PK: `id`. FK: `space_id` → `spaces`. Columns: `space_id`, `target_user_id`, `sent_by`, `task_id`, `type`, `tone`, `message`, `sent_at`, `acknowledged_at`, `created_at`.

### `push_subscriptions` (types.ts L8605)
`id`, `user_id`, `endpoint`, `subscription_data jsonb`, `is_active`, `created_at`, `updated_at`.

### `newsletter_subscriptions` (types.ts L6363)
PK: `id`. FK: `region_interest` → `regions(id)`. Columns: `email`, `full_name`, `country_interests text[]`, `region_interest uuid`, `subscription_type`, `is_active`.

### `hub_notification_signups` (L5407)
`email`, `name`, `hub`, `user_id`, `preferences jsonb`.

---

## 18. Admin / Moderation / Analytics

| Table | Key cols (PK `id`) |
|---|---|
| `admin_activity_log` (L656) | `admin_id`, `action`, `entity_type/id`, `details jsonb`, `created_at` |
| `analytics_events` (L779) | `user_id`, `event_name`, `route`, `event_metadata jsonb` |
| `dashboard_analytics` (L2461) | `user_id` (FK→profiles), `user_role`, `event_type`, `event_data`, `route`, `session_id` |
| `activity_events` (L17) | `user_id`, `entity_type/id`, `event_type`, `metadata` |
| `cron_job_logs` (L2363) | `job_name`, `status`, `events_processed`, `reminders_sent`, `started_at`, `completed_at`, `error_message`, `metadata` |
| `content_flags` (L1584) | `content_id`, `content_type`, `flagged_by` (FK→profiles), `reason`, `resolved_by/at`, `moderator_notes` |
| `content_moderation` (L1649) | `content_id`, `content_type`, `moderator_id` (FK), `action`, `status`, `reason`, `resolved_at` |
| `error_logs` (L3158) | `error_type`, `error_message`, `error_stack`, `component_stack`, `url`, `user_agent`, `user_id`, `severity`, `metadata` |
| `events_log` (L4054) | `event_type`, `payload`, `created_at` |
| `rate_limit_checks` (L8635) | `user_id`, `action_type`, `created_at` |
| `user_reports` (L11591) | `reporter_id`, `target_user_id`, `reason` (`user_report_reason` enum), `details`, `status` (`user_report_status` enum), `conversation_id`, `message_id` |
| `feature_flags` (L4174) | flag store |

---

## 19. Feedback / Alpha / Beta

| Table | Key cols (PK `id`) |
|---|---|
| `alpha_feedback` (L743) | `user_id`, `category`, `area`, `content`, `page_url`, `device_type`, `viewport` |
| `user_feedback` (L11360) | `user_id`, `type`, `message`, `status`, `priority`, `admin_notes` |
| `feedback_channels` (L4507) | internal feedback system |
| `feedback_channel_memberships` (L4469) | |
| `feedback_messages` (L4543) | |
| `feedback_reactions` (L4621) | |
| `feedback_attachments` (L4431) | |
| `beta_waitlist` (L897) | `email`, `full_name`, `linkedin_url`, `message`, `status`, `last_invite_sent_at/by`, `archived_at/by` |
| `waitlist_notes` (L11842) | `waitlist_entry_id` (FK→beta_waitlist), `author_id`, `note` |
| `waitlist_signups` (L11874) | legacy waitlist |

---

## 20. Advertising / Sponsorship

| Table | Key cols (PK `id`) |
|---|---|
| `advertisers` (L686) | `name`, `slug`, `description`, `logo_url`, `website_url`, `contact_*`, `billing_email`, `status` (enum), `tier` (enum), `internal_notes`, `created_by` |
| `ad_campaigns` (L47) | `advertiser_id` (FK), `name`, `headline`, `body`, `cta_label`, `cta_url`, `image_url`, `status`, `target_placement`, `priority`, `daily_budget_cents`, `total_budget_cents`, `spent_cents`, `impression_count`, `click_count`, `starts_at`, `ends_at` |
| `ad_intake_submissions` (L124) | external lead form |
| `sponsors` (L10940) | `name`, `slug`, `tier`, `description`, `logo_url`, `website_url`, `contact_*`, `is_active` |
| `sponsor_placements` (L10881) | `sponsor_id` (FK), `placement`, `headline`, `cta_label/url`, `priority`, `starts_at`, `ends_at`, `is_active`, `impression_count`, `click_count`, `status` |

---

## 21. Roadmap Subsystem

Event/conference micro-product (types.ts L9406-10153). Tables: `roadmap_attendees`, `roadmap_event_photos`, `roadmap_impact_metrics`, `roadmap_reminder_prefs`, `roadmap_saved_sessions`, `roadmap_session_reminder_sends`, `roadmap_sessions`, `roadmap_speaker_followers`, `roadmap_speaker_update_sends`, `roadmap_speaker_updates`, `roadmap_speakers`, `roadmap_sponsor_digest_sends`, `roadmap_sponsor_leads`, `roadmap_sponsor_managers`, `roadmap_sponsors`, `roadmap_subscribers`, `roadmap_survey_responses`, `roadmap_testimonials`, `roadmap_tracks`.

---

## 22. Remittance Sub-domain

CONVEY data (types.ts L8843-9375; ~20 tables of mostly static reference data). Tables: `remittance_caveats`, `remittance_channel_players`, `remittance_channels`, `remittance_citations`, `remittance_compare_corridors`, `remittance_corridor_comparisons`, `remittance_cost_data`, `remittance_diaspora_bonds`, `remittance_diaspora_regions`, `remittance_fatf_status`, `remittance_forecast`, `remittance_future_trends`, `remittance_fx_cases`, `remittance_gdp_leaders`, `remittance_macro_flows`, `remittance_newsletter_subscribers`, `remittance_sources`, `remittance_top_corridors`, `remittance_top_recipients`, `remittance_use_of_funds`.

---

## 23. Search Vectors / Recommendations / Engagement

| Table | Key cols |
|---|---|
| `entity_vectors` (L3125) | `entity_id`, `entity_type`, `source`, `dimension`, `vector jsonb` |
| `user_vectors` (L11683) | `user_id` PK, `source`, `dimension`, `vector jsonb` |
| `user_recommendations` (L11534) | `user_id` (FK→profiles), `recommendation_type`, `target_id`, `target_title`, `target_description`, `match_score`, `match_reasons`, `status` |
| `user_interactions` (L11417) | `user_id`, `entity_type/id`, `interaction_type`, `context_c`, `weight`, `metadata` |
| `user_last_view_state` (L11453) | `user_id` PK (1:1 FK→profiles), `last_view_state`, `last_visited_at`, `context` |
| `user_dashboard_preferences` (L11243) | `user_id` PK (1:1 FK→profiles), `visible_modules jsonb`, `collapsed_modules jsonb`, `density` |
| `user_onboarding_selections` (L11489) | `user_id` (FK→profiles), `selection_type`, `target_id`, `target_title`, `selected_at` |
| `search_preferences` (L10299) | `user_id`, `default_filters jsonb`, `saved_searches jsonb` |
| `hub_metrics` (L5362) | `hub_id`, `hub_type`, `connections_made`, `events_hosted`, `members_connected`, `contributions_total`, `projects_active`, `stories_published`, `last_calculated_at` |

---

## 24. Misc / Legacy

| Table | Purpose |
|---|---|
| `feature_flags` (L4174) | flag store |
| `module_status` (L6118) | per-module rollout state (`module_status_state` enum) |
| `invites` (L5768) | `code`, `email`, `referral_code`, `expires_at`, `used_at`, `used_by_id`, `role` |
| `projects` (L8531) + `project_contributions` (L8484) | legacy project system |
| `releases` (L8765) + `release_features` (L8733) | release notes |
| `user_communities` (L11178) | community membership cache (owner_id → users) |
| `user_blocks` (L11157) | duplicate of `blocked_users` |
| `user_connections` (L11222) | follow-style connection |
| `user_follows` (L11396) | follow relationships |
| `monthly_reports` (L6142) | see Geography section |
| `cron_job_logs` (L2363) | see Admin section |

---

## 25. Views

From types.ts L11911-12080:

| View | Columns |
|---|---|
| `adin_cost_tracking` | `date`, `queries`, `total_tokens`, `total_cost`, `avg_cost_per_query` |
| `adin_daily_stats` | `date`, `total_queries`, `cache_hits`, `cache_misses`, `cache_hit_rate`, `avg_response_time_ms` |
| `adin_popular_queries` | popular query rollup |
| `public_profiles` | public-safe subset of `profiles` (many FK relationships target this view as well as the base table) |
| `pulse_metrics_daily` | daily Five Cs pulse metrics |
| `user_impact_summary` | per-user impact aggregation |

---

## Appendix A — D054-relevant tables that DO NOT exist yet  <a id="appendix-a"></a>

After grepping all 753 migrations:

- **`witness*`** — 0 occurrences
- **`affirmation*`** — 0 occurrences
- **`declaration*`** — found only in `need_declarations` (a different concept) and as comment text on `contribution_manifests`

If a Witness/Affirmation system is in the product plan, **it must be added in the D054 migration**. Closest existing analogues (none are a substitute):
- `contribution_acknowledgments` — peer-attested thank-you with rating
- `verified_contributors` — admin-asserted verification
- `currency_stances` + `contribution_manifests` — self-declared "how I show up"
- `impact_attributions` — connection-level impact tagging

There is also **no D054-style identity-role column** on `profiles`. Existing role-like surfaces:
- `user_roles.role` enum `app_role` — RBAC permission (user / moderator / admin), not identity
- `profiles.user_type` text — defaults to `'member'`, free-text
- `profiles.user_role` text — free-text
- `profiles.roles text[]` — free-text array
- `profiles.is_admin bool` — likely deprecated

None of these encode (returnee / anchor / ally / exploring); D054 must introduce a new column or enum.

---

## Appendix B — Tables with continent/country/location fields  <a id="appendix-b"></a>

(Relevance hot-list for the DNA × Place migration.)

- **`profiles`** — `current_country`, `current_country_id`, `current_country_code`, `current_country_name`, `country_of_origin`, `country_of_origin_id`, `country_origin`, `origin_country_code`, `origin_country_name`, `current_city`, `city`, `current_region`, `current_location`, `location`, `location_preference`, `diaspora_origin`, `impact_regions`, `regional_expertise`
- **`events`** — `location_name/address/city/country/lat/lng`
- **`opportunities`** — `location`
- **`organizations`** — `country_id`
- **`countries`** — full country profile (rich); has `country_code_iso2`, `iso3`, `iso_code`
- **`regions`** / **`continents`** / **`provinces`** — reference hierarchy
- **`adin_signals`** — `region_focus[]`
- **`contribution_needs`** — `region`
- **`spaces`** — `region`
- **`communities`** — `tags` (no explicit country)
- **`groups`** — `location`
- **`community_events`** — `location`
- **`dia_insights`** — `region`
- **`diaspora_data`**, **`economic_indicators`**, **`innovation_data`**, **`political_digest`**, **`monthly_reports`** — all FK to `countries`/`regions`/`provinces`
- **`adin_contributor_requests`** — `country_focus`
- **`newsletter_subscriptions`** — `country_interests[]`, `region_interest` (FK→regions)

> Country representation in `profiles` is highly redundant (8+ overlapping columns). The D054 plan picks two new canonical columns (`continent`, `country`) and leaves the legacy columns untouched for backward compatibility.

---

## Appendix C — Storage Buckets  <a id="appendix-c"></a>

(From schema export doc, not in types.ts.)

| Bucket | Public | Notes |
|---|---|---|
| `avatars`, `banners`, `event-images`, `event-media`, `feedback-media`, `message-attachments`, `messages`, `organization-logos`, `post-media`, `profile-images`, `profile-pictures`, `story-hero-images`, `user-posts` | public | |
| `space-attachments` | private | |

Storage RLS policies for `profile-pictures` defined in `20250610215537-...sql` (own-folder upload/update/delete; public select).
