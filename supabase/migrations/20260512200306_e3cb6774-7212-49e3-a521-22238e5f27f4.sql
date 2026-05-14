-- ============================================================================
-- DNA CONTRIBUTE Module - Phase 3: The Room
-- ============================================================================

create type match_kind as enum (
  'their_stance_my_need',
  'their_need_my_stance',
  'mutual',
  'tag_affinity'
);

create type reasoning_source as enum ('sql', 'dia');

create table room_curations (
  id uuid primary key default gen_random_uuid(),
  viewer_user_id uuid not null references auth.users(id) on delete cascade,
  subject_user_id uuid not null references auth.users(id) on delete cascade,
  kind match_kind not null,
  subject_stance_id uuid references currency_stances(id) on delete cascade,
  subject_need_id uuid references need_declarations(id) on delete cascade,
  viewer_stance_id uuid references currency_stances(id) on delete cascade,
  viewer_need_id uuid references need_declarations(id) on delete cascade,
  currency contribution_currency not null,
  score numeric(4,3) not null default 0
    check (score >= 0 and score <= 1),
  reasoning text not null
    check (char_length(trim(reasoning)) > 0),
  reasoning_source reasoning_source not null default 'sql',
  curation_date date not null default (now() at time zone 'utc')::date,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint unique_curation_per_day
    unique (viewer_user_id, subject_user_id, kind, curation_date)
);

comment on table room_curations is
  'Daily-curated room recommendations per viewer. Each row is one match. Recomputed by curate_room_for_user, swept by purge_stale_curations.';

create index idx_room_curations_viewer_today
  on room_curations(viewer_user_id, curation_date desc, score desc)
  where dismissed_at is null;

create index idx_room_curations_purge
  on room_curations(curation_date);

-- ----------------------------------------------------------------------------
create or replace function tag_overlap_count(a text[], b text[])
returns integer
language sql
immutable
as $$
  select count(*)::integer
  from (
    select unnest(a) a_tag
    intersect
    select unnest(b) b_tag
  ) overlap;
$$;

-- ----------------------------------------------------------------------------
create or replace function compute_reasoning_string(
  p_kind match_kind,
  p_currency contribution_currency,
  p_subject_stance_title text,
  p_subject_need_title text,
  p_viewer_stance_title text,
  p_viewer_need_title text,
  p_shared_tags text[]
)
returns text
language plpgsql
immutable
as $$
declare
  v_currency_label text;
  v_shared_tag text;
begin
  v_currency_label := initcap(p_currency::text);

  if p_kind = 'their_stance_my_need' then
    return format(
      'They offer %s in %s. You''re seeking %s for %s.',
      v_currency_label,
      coalesce(p_subject_stance_title, 'this'),
      v_currency_label,
      coalesce(p_viewer_need_title, 'your work')
    );
  elsif p_kind = 'their_need_my_stance' then
    return format(
      'You offer %s in %s. They''re seeking %s for %s.',
      v_currency_label,
      coalesce(p_viewer_stance_title, 'this'),
      v_currency_label,
      coalesce(p_subject_need_title, 'their work')
    );
  elsif p_kind = 'mutual' then
    return format(
      'You and they both work in %s, and each of you is seeking what the other offers.',
      v_currency_label
    );
  elsif p_kind = 'tag_affinity' then
    if array_length(p_shared_tags, 1) is not null and array_length(p_shared_tags, 1) > 0 then
      v_shared_tag := p_shared_tags[1];
      return format(
        'You share work in %s and %s.',
        v_shared_tag,
        v_currency_label
      );
    else
      return format('You both work in %s.', v_currency_label);
    end if;
  end if;

  return format('Match in %s.', v_currency_label);
end;
$$;

-- ----------------------------------------------------------------------------
create or replace function curate_room_for_user(
  p_max_per_kind integer default 5
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
  v_inserted integer := 0;
  v_existing integer;
begin
  if v_user_id is null then
    raise exception 'curate_room_for_user called without authenticated user'
      using errcode = 'insufficient_privilege';
  end if;

  select count(*) into v_existing
    from room_curations
    where viewer_user_id = v_user_id
      and curation_date = v_today;

  if v_existing > 0 then
    return v_existing;
  end if;

  insert into room_curations (
    viewer_user_id, subject_user_id, kind, currency,
    subject_stance_id, viewer_need_id,
    score, reasoning, reasoning_source, curation_date
  )
  select distinct on (s.user_id, n.id)
    v_user_id,
    s.user_id,
    'their_stance_my_need'::match_kind,
    s.currency,
    s.id,
    n.id,
    least(1.0, (
      coalesce(tag_overlap_count(s.tags, n.tags), 0) * 0.15
      + 0.5
      + greatest(0, 0.2 - (extract(epoch from (now() - n.published_at)) / 86400.0 / 30.0) * 0.2)
    )),
    compute_reasoning_string(
      'their_stance_my_need',
      s.currency,
      s.title,
      n.title,
      null,
      null,
      array(select unnest(s.tags) intersect select unnest(n.tags))
    ),
    'sql',
    v_today
  from need_declarations n
  join currency_stances s on s.currency = n.currency
  join contribution_manifests m on m.id = s.manifest_id and m.is_published = true
  where n.user_id = v_user_id
    and n.status = 'open'
    and s.user_id != v_user_id
    and s.is_archived = false
    and s.visibility = 'public'
  order by s.user_id, n.id, (
    coalesce(tag_overlap_count(s.tags, n.tags), 0) * 0.15
    + 0.5
    + greatest(0, 0.2 - (extract(epoch from (now() - n.published_at)) / 86400.0 / 30.0) * 0.2)
  ) desc
  limit p_max_per_kind
  on conflict (viewer_user_id, subject_user_id, kind, curation_date) do nothing;

  get diagnostics v_inserted = row_count;

  insert into room_curations (
    viewer_user_id, subject_user_id, kind, currency,
    viewer_stance_id, subject_need_id,
    score, reasoning, reasoning_source, curation_date
  )
  select distinct on (n.user_id, s.id)
    v_user_id,
    n.user_id,
    'their_need_my_stance'::match_kind,
    n.currency,
    s.id,
    n.id,
    least(1.0, (
      coalesce(tag_overlap_count(s.tags, n.tags), 0) * 0.15
      + 0.5
      + greatest(0, 0.2 - (extract(epoch from (now() - n.published_at)) / 86400.0 / 30.0) * 0.2)
    )),
    compute_reasoning_string(
      'their_need_my_stance',
      n.currency,
      null,
      n.title,
      s.title,
      null,
      array(select unnest(s.tags) intersect select unnest(n.tags))
    ),
    'sql',
    v_today
  from currency_stances s
  join contribution_manifests m on m.id = s.manifest_id and m.user_id = v_user_id
  join need_declarations n on n.currency = s.currency
  where s.user_id = v_user_id
    and s.is_archived = false
    and n.user_id != v_user_id
    and n.status = 'open'
    and n.visibility = 'public'
  order by n.user_id, s.id, (
    coalesce(tag_overlap_count(s.tags, n.tags), 0) * 0.15
    + 0.5
    + greatest(0, 0.2 - (extract(epoch from (now() - n.published_at)) / 86400.0 / 30.0) * 0.2)
  ) desc
  limit p_max_per_kind
  on conflict (viewer_user_id, subject_user_id, kind, curation_date) do nothing;

  insert into room_curations (
    viewer_user_id, subject_user_id, kind, currency,
    subject_stance_id, viewer_stance_id,
    score, reasoning, reasoning_source, curation_date
  )
  select distinct on (subj.user_id)
    v_user_id,
    subj.user_id,
    'tag_affinity'::match_kind,
    subj.currency,
    subj.id,
    mine.id,
    least(0.5, coalesce(tag_overlap_count(mine.tags, subj.tags), 0) * 0.15),
    compute_reasoning_string(
      'tag_affinity',
      subj.currency,
      subj.title,
      null,
      mine.title,
      null,
      array(select unnest(mine.tags) intersect select unnest(subj.tags))
    ),
    'sql',
    v_today
  from currency_stances mine
  join contribution_manifests mm on mm.id = mine.manifest_id and mm.user_id = v_user_id
  join currency_stances subj on tag_overlap_count(mine.tags, subj.tags) >= 1
  join contribution_manifests sm on sm.id = subj.manifest_id and sm.is_published = true
  where mine.user_id = v_user_id
    and mine.is_archived = false
    and subj.user_id != v_user_id
    and subj.is_archived = false
    and subj.visibility = 'public'
    and not exists (
      select 1 from room_curations rc
      where rc.viewer_user_id = v_user_id
        and rc.subject_user_id = subj.user_id
        and rc.curation_date = v_today
    )
  order by subj.user_id, tag_overlap_count(mine.tags, subj.tags) desc
  limit p_max_per_kind
  on conflict (viewer_user_id, subject_user_id, kind, curation_date) do nothing;

  select count(*) into v_inserted
    from room_curations
    where viewer_user_id = v_user_id
      and curation_date = v_today;

  return v_inserted;
end;
$$;

comment on function curate_room_for_user is
  'Computes today''s room curations for the calling user. Idempotent within a day. Returns total curations for today.';

grant execute on function curate_room_for_user(integer) to authenticated;

-- ----------------------------------------------------------------------------
create or replace function get_room_for_viewer()
returns table (
  curation_id uuid,
  subject_user_id uuid,
  kind match_kind,
  currency contribution_currency,
  subject_stance_id uuid,
  subject_stance_title text,
  subject_need_id uuid,
  subject_need_title text,
  subject_need_context text,
  subject_need_scope need_scope,
  viewer_stance_id uuid,
  viewer_stance_title text,
  viewer_need_id uuid,
  viewer_need_title text,
  score numeric,
  reasoning text,
  reasoning_source reasoning_source,
  curation_date date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'get_room_for_viewer called without authenticated user'
      using errcode = 'insufficient_privilege';
  end if;

  select count(*) into v_count
    from room_curations
    where viewer_user_id = v_user_id
      and curation_date = v_today;

  if v_count = 0 then
    perform curate_room_for_user(5);
  end if;

  return query
    select
      rc.id,
      rc.subject_user_id,
      rc.kind,
      rc.currency,
      rc.subject_stance_id,
      ss.title,
      rc.subject_need_id,
      sn.title,
      sn.context,
      sn.scope,
      rc.viewer_stance_id,
      vs.title,
      rc.viewer_need_id,
      vn.title,
      rc.score,
      rc.reasoning,
      rc.reasoning_source,
      rc.curation_date
    from room_curations rc
    left join currency_stances ss on ss.id = rc.subject_stance_id
    left join need_declarations sn on sn.id = rc.subject_need_id
    left join currency_stances vs on vs.id = rc.viewer_stance_id
    left join need_declarations vn on vn.id = rc.viewer_need_id
    where rc.viewer_user_id = v_user_id
      and rc.curation_date = v_today
      and rc.dismissed_at is null
    order by
      case rc.kind
        when 'mutual' then 1
        when 'their_stance_my_need' then 2
        when 'their_need_my_stance' then 3
        when 'tag_affinity' then 4
      end,
      rc.score desc,
      rc.created_at;
end;
$$;

comment on function get_room_for_viewer is
  'Returns today''s curated room for the calling user. Auto-triggers curate_room_for_user if today''s set is empty.';

grant execute on function get_room_for_viewer() to authenticated;

-- ----------------------------------------------------------------------------
create or replace function dismiss_curation(curation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'dismiss_curation called without authenticated user'
      using errcode = 'insufficient_privilege';
  end if;

  update room_curations
    set dismissed_at = now()
    where id = curation_id
      and viewer_user_id = v_user_id;
end;
$$;

comment on function dismiss_curation is
  'Marks a curation as dismissed for the rest of the day for the calling user.';

grant execute on function dismiss_curation(uuid) to authenticated;

-- ----------------------------------------------------------------------------
create or replace function purge_stale_curations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with purged as (
    delete from room_curations
    where curation_date < (now() at time zone 'utc')::date - interval '7 days'
    returning 1
  )
  select count(*) into v_count from purged;

  return coalesce(v_count, 0);
end;
$$;

comment on function purge_stale_curations is
  'Sweep curations older than 7 days. Idempotent. Call from scheduled edge function.';

revoke all on function purge_stale_curations() from public;
revoke all on function purge_stale_curations() from authenticated;

-- ----------------------------------------------------------------------------
alter table room_curations enable row level security;

create policy "Viewers can read their own curations"
  on room_curations
  for select
  to authenticated
  using (viewer_user_id = auth.uid());

-- ----------------------------------------------------------------------------
create or replace function get_room_readiness()
returns table (
  has_manifest boolean,
  manifest_published boolean,
  active_stance_count integer,
  active_need_count integer,
  curation_count_today integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
begin
  if v_user_id is null then
    raise exception 'get_room_readiness called without authenticated user'
      using errcode = 'insufficient_privilege';
  end if;

  return query
    select
      exists(select 1 from contribution_manifests where user_id = v_user_id),
      exists(select 1 from contribution_manifests where user_id = v_user_id and is_published = true),
      (select count(*)::integer from currency_stances where user_id = v_user_id and is_archived = false),
      (select count(*)::integer from need_declarations where user_id = v_user_id and status in ('open', 'matched')),
      (select count(*)::integer from room_curations where viewer_user_id = v_user_id and curation_date = v_today and dismissed_at is null);
end;
$$;

comment on function get_room_readiness is
  'Returns hub-render signals for empty states and onboarding flow.';

grant execute on function get_room_readiness() to authenticated;