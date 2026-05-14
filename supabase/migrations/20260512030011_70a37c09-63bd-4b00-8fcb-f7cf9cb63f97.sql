-- ============================================================================
-- DNA CONTRIBUTE Module — Phase 1: The Manifest
-- ============================================================================

create type contribution_currency as enum (
  'expertise',
  'network',
  'resources',
  'capital'
);

create type stance_availability as enum (
  'open_ongoing',
  'monthly_hours',
  'quarterly',
  'project_based',
  'limited_capacity'
);

create type stance_visibility as enum (
  'public',
  'connections_only',
  'private'
);

create table contribution_manifests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  headline text,
  is_published boolean not null default false,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table contribution_manifests is
  'A user''s durable, public declaration of how they show up for the diaspora. One per user. Stances live in currency_stances.';

create index idx_manifests_published
  on contribution_manifests(is_published)
  where is_published = true;

create table currency_stances (
  id uuid primary key default gen_random_uuid(),
  manifest_id uuid not null references contribution_manifests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  currency contribution_currency not null,
  title text not null check (char_length(title) between 4 and 120),
  description text check (char_length(description) <= 600),
  tags text[] not null default '{}'::text[]
    check (array_length(tags, 1) is null or array_length(tags, 1) <= 8),
  availability stance_availability not null default 'open_ongoing',
  visibility stance_visibility not null default 'public',
  display_order smallint not null default 0,
  is_archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_active_stance_title
    unique nulls not distinct (user_id, currency, title, is_archived)
);

comment on table currency_stances is
  'Individual stance declarations within a manifest. Each stance is one currency. Manifests soft-cap at 3 substantive stances in the UI but schema supports up to 5.';

create index idx_stances_manifest_active
  on currency_stances(manifest_id, display_order)
  where is_archived = false;

create index idx_stances_currency_public
  on currency_stances(currency)
  where is_archived = false and visibility = 'public';

create index idx_stances_tags
  on currency_stances using gin(tags)
  where is_archived = false;

alter table currency_stances
  add constraint capital_deferred_v1
  check (currency != 'capital');

comment on constraint capital_deferred_v1 on currency_stances is
  'Capital currency is architecturally supported but UI-disabled for v1. Drop this constraint when enabling capital stance authoring in v2.';

-- Triggers
create or replace function set_updated_at_contribute()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_manifests_updated_at
  before update on contribution_manifests
  for each row execute function set_updated_at_contribute();

create trigger trg_stances_updated_at
  before update on currency_stances
  for each row execute function set_updated_at_contribute();

create or replace function stamp_archived_at()
returns trigger
language plpgsql
as $$
begin
  if new.is_archived = true and (old.is_archived = false or old.is_archived is null) then
    new.archived_at = now();
  elsif new.is_archived = false then
    new.archived_at = null;
  end if;
  return new;
end;
$$;

create trigger trg_stances_archive_stamp
  before update on currency_stances
  for each row execute function stamp_archived_at();

create or replace function enforce_active_stance_cap()
returns trigger
language plpgsql
as $$
declare
  active_count integer;
begin
  select count(*) into active_count
    from currency_stances
    where manifest_id = new.manifest_id
      and is_archived = false
      and id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if active_count >= 5 and new.is_archived = false then
    raise exception 'Manifest cap exceeded: a manifest may have at most 5 active stances. Archive a stance before adding a new one.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger trg_stances_enforce_cap
  before insert or update on currency_stances
  for each row execute function enforce_active_stance_cap();

-- RLS: contribution_manifests
alter table contribution_manifests enable row level security;

create policy "Published manifests are visible to authenticated users"
  on contribution_manifests for select to authenticated
  using (is_published = true);

create policy "Users can read their own manifest"
  on contribution_manifests for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own manifest"
  on contribution_manifests for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own manifest"
  on contribution_manifests for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can delete their own manifest"
  on contribution_manifests for delete to authenticated
  using (user_id = auth.uid());

-- RLS: currency_stances
alter table currency_stances enable row level security;

create policy "Public stances on published manifests are visible"
  on currency_stances for select to authenticated
  using (
    visibility = 'public'
    and is_archived = false
    and exists (
      select 1 from contribution_manifests m
      where m.id = currency_stances.manifest_id and m.is_published = true
    )
  );

create policy "Connections-only stances are visible to connections"
  on currency_stances for select to authenticated
  using (
    visibility = 'connections_only'
    and is_archived = false
    and exists (
      select 1 from contribution_manifests m
      where m.id = currency_stances.manifest_id and m.is_published = true
    )
    and (
      user_id = auth.uid()
      or exists (
        select 1 from connections c
        where c.status = 'accepted'
          and (
            (c.requester_id = auth.uid() and c.recipient_id = currency_stances.user_id)
            or (c.recipient_id = auth.uid() and c.requester_id = currency_stances.user_id)
          )
      )
    )
  );

create policy "Users can read their own stances"
  on currency_stances for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own stances"
  on currency_stances for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from contribution_manifests m
      where m.id = manifest_id and m.user_id = auth.uid()
    )
  );

create policy "Users can update their own stances"
  on currency_stances for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can delete their own stances"
  on currency_stances for delete to authenticated
  using (user_id = auth.uid());

-- RPCs
create or replace function ensure_manifest()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_manifest_id uuid;
begin
  if v_user_id is null then
    raise exception 'ensure_manifest called without authenticated user'
      using errcode = 'insufficient_privilege';
  end if;

  select id into v_manifest_id
    from contribution_manifests
    where user_id = v_user_id;

  if v_manifest_id is null then
    insert into contribution_manifests (user_id, is_published)
      values (v_user_id, false)
      returning id into v_manifest_id;
  end if;

  return v_manifest_id;
end;
$$;

comment on function ensure_manifest is
  'Lazy-creates a manifest for the calling user. Idempotent. Returns manifest_id.';

grant execute on function ensure_manifest() to authenticated;

create or replace function publish_manifest()
returns contribution_manifests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_manifest contribution_manifests;
  v_stance_count integer;
begin
  if v_user_id is null then
    raise exception 'publish_manifest called without authenticated user'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_manifest
    from contribution_manifests
    where user_id = v_user_id;

  if v_manifest.id is null then
    raise exception 'No manifest exists for this user. Call ensure_manifest first.'
      using errcode = 'no_data_found';
  end if;

  if v_manifest.headline is null or char_length(trim(v_manifest.headline)) = 0 then
    raise exception 'Manifest cannot be published without a headline.'
      using errcode = 'check_violation';
  end if;

  select count(*) into v_stance_count
    from currency_stances
    where manifest_id = v_manifest.id and is_archived = false;

  if v_stance_count = 0 then
    raise exception 'Manifest cannot be published without at least one active stance.'
      using errcode = 'check_violation';
  end if;

  update contribution_manifests
    set is_published = true,
        last_reviewed_at = now()
    where id = v_manifest.id
    returning * into v_manifest;

  return v_manifest;
end;
$$;

comment on function publish_manifest is
  'Publishes the calling user''s manifest. Requires headline + at least one active stance.';

grant execute on function publish_manifest() to authenticated;

create or replace function get_manifest_for_user(target_user_id uuid)
returns table (
  manifest_id uuid,
  headline text,
  is_published boolean,
  last_reviewed_at timestamptz,
  stance_id uuid,
  currency contribution_currency,
  title text,
  description text,
  tags text[],
  availability stance_availability,
  visibility stance_visibility,
  display_order smallint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select
      m.id, m.headline, m.is_published, m.last_reviewed_at,
      s.id, s.currency, s.title, s.description, s.tags,
      s.availability, s.visibility, s.display_order
    from contribution_manifests m
    left join currency_stances s
      on s.manifest_id = m.id and s.is_archived = false
    where m.user_id = target_user_id
      and (
        m.user_id = auth.uid()
        or (
          m.is_published = true
          and (
            s.id is null
            or s.visibility = 'public'
            or (
              s.visibility = 'connections_only'
              and exists (
                select 1 from connections c
                where c.status = 'accepted'
                  and (
                    (c.requester_id = auth.uid() and c.recipient_id = target_user_id)
                    or (c.recipient_id = auth.uid() and c.requester_id = target_user_id)
                  )
              )
            )
          )
        )
      )
    order by s.display_order nulls last, s.created_at;
end;
$$;

comment on function get_manifest_for_user is
  'Returns a manifest + visible stances for the target user, respecting visibility rules.';

grant execute on function get_manifest_for_user(uuid) to authenticated;