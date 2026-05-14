-- ============================================================================
-- DNA CONTRIBUTE Module - Phase 2: The Need (table: need_declarations)
-- ============================================================================

create type need_status as enum (
  'draft', 'open', 'matched', 'fulfilled', 'closed', 'expired'
);

create type need_scope as enum (
  'one_off', 'few_hours', 'short_project', 'extended', 'open_ended'
);

create table need_declarations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  currency contribution_currency not null,
  title text not null check (char_length(title) between 4 and 120),
  context text check (context is null or char_length(context) <= 1000),
  scope need_scope not null default 'open_ended',
  related_stance_id uuid references currency_stances(id) on delete set null,
  tags text[] not null default '{}'::text[]
    check (array_length(tags, 1) is null or array_length(tags, 1) <= 8),
  visibility stance_visibility not null default 'public',
  status need_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  expires_at timestamptz,
  published_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_need_decls_have_timestamp
    check ((status in ('draft')) or published_at is not null),
  constraint closed_need_decls_have_timestamp
    check ((status not in ('closed', 'expired')) or closed_at is not null),
  constraint need_decl_ends_after_starts
    check (starts_at is null or ends_at is null or ends_at > starts_at),
  constraint need_decl_capital_deferred_v1
    check (currency != 'capital')
);

comment on table need_declarations is
  'A user''s active, time-bound declaration of what they are building and seeking. Peer entity to contribution_manifests. (Renamed from contribution_needs which was already taken by a legacy spaces-bound table.)';

create index idx_need_decls_user_active
  on need_declarations(user_id, created_at desc)
  where status in ('draft', 'open', 'matched');

create index idx_need_decls_currency_open
  on need_declarations(currency, published_at desc)
  where status = 'open' and visibility = 'public';

create index idx_need_decls_expiration_sweep
  on need_declarations(expires_at)
  where status = 'open' and expires_at is not null;

create index idx_need_decls_tags
  on need_declarations using gin(tags)
  where status = 'open';

create index idx_need_decls_user_public
  on need_declarations(user_id, published_at desc)
  where status = 'open' and visibility = 'public';

create trigger trg_need_decls_updated_at
  before update on need_declarations
  for each row execute function set_updated_at();

create or replace function stamp_need_declaration_lifecycle()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_max_active_days integer := 90;
begin
  if (old.status = 'draft' or old.status is null)
     and new.status not in ('draft')
     and new.published_at is null then
    new.published_at = now();
    if new.expires_at is null then
      if new.ends_at is not null and new.ends_at < (now() + (v_max_active_days || ' days')::interval) then
        new.expires_at = new.ends_at;
      else
        new.expires_at = now() + (v_max_active_days || ' days')::interval;
      end if;
    end if;
  end if;

  if new.status in ('closed', 'expired')
     and (old.status is null or old.status not in ('closed', 'expired'))
     and new.closed_at is null then
    new.closed_at = now();
  end if;

  if old.status in ('closed', 'expired')
     and new.status not in ('closed', 'expired') then
    new.closed_at = null;
  end if;

  return new;
end;
$$;

create trigger trg_need_decls_lifecycle_stamp
  before insert or update on need_declarations
  for each row execute function stamp_need_declaration_lifecycle();

create or replace function enforce_active_need_declaration_cap()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_active_count integer;
  v_cap integer := 10;
begin
  if new.status not in ('draft', 'open', 'matched') then
    return new;
  end if;

  select count(*) into v_active_count
    from need_declarations
    where user_id = new.user_id
      and status in ('draft', 'open', 'matched')
      and id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if v_active_count >= v_cap then
    raise exception 'Need cap exceeded: a user may have at most % active Needs. Close one before adding another.', v_cap
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger trg_need_decls_enforce_cap
  before insert or update on need_declarations
  for each row execute function enforce_active_need_declaration_cap();

alter table need_declarations enable row level security;

create policy "Open public need declarations are visible to authenticated"
  on need_declarations for select to authenticated
  using (visibility = 'public' and status in ('open', 'matched', 'fulfilled'));

create policy "Open connections-only need declarations visible to connections"
  on need_declarations for select to authenticated
  using (
    visibility = 'connections_only'
    and status in ('open', 'matched', 'fulfilled')
    and (
      user_id = auth.uid()
      or exists (
        select 1 from connections c
        where c.status = 'accepted'
          and (
            (c.requester_id = auth.uid() and c.recipient_id = need_declarations.user_id)
            or (c.recipient_id = auth.uid() and c.requester_id = need_declarations.user_id)
          )
      )
    )
  );

create policy "Users can read their own need declarations"
  on need_declarations for select to authenticated using (user_id = auth.uid());

create policy "Users can insert their own need declarations"
  on need_declarations for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update their own need declarations"
  on need_declarations for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can delete their own need declarations"
  on need_declarations for delete to authenticated using (user_id = auth.uid());

create or replace function publish_need_declaration(declaration_id uuid)
returns need_declarations
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row need_declarations;
begin
  if v_user_id is null then
    raise exception 'publish_need_declaration called without authenticated user'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_row from need_declarations
    where id = declaration_id and user_id = v_user_id for update;

  if v_row.id is null then
    raise exception 'Need declaration not found or not owned by caller'
      using errcode = 'no_data_found';
  end if;

  if v_row.status != 'draft' then
    raise exception 'Need declaration is not in draft status (current: %)', v_row.status
      using errcode = 'check_violation';
  end if;

  if v_row.title is null or char_length(trim(v_row.title)) < 4 then
    raise exception 'Need declaration cannot be published without a title'
      using errcode = 'check_violation';
  end if;

  update need_declarations set status = 'open' where id = declaration_id
    returning * into v_row;
  return v_row;
end;
$$;

grant execute on function publish_need_declaration(uuid) to authenticated;

create or replace function close_need_declaration(declaration_id uuid)
returns need_declarations
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row need_declarations;
begin
  if v_user_id is null then
    raise exception 'close_need_declaration called without authenticated user'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_row from need_declarations
    where id = declaration_id and user_id = v_user_id for update;

  if v_row.id is null then
    raise exception 'Need declaration not found or not owned by caller'
      using errcode = 'no_data_found';
  end if;

  if v_row.status in ('closed', 'expired') then
    raise exception 'Need declaration is already closed'
      using errcode = 'check_violation';
  end if;

  update need_declarations set status = 'closed' where id = declaration_id
    returning * into v_row;
  return v_row;
end;
$$;

grant execute on function close_need_declaration(uuid) to authenticated;

create or replace function get_need_declarations_for_user(target_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  currency contribution_currency,
  title text,
  context text,
  scope need_scope,
  related_stance_id uuid,
  tags text[],
  visibility stance_visibility,
  status need_status,
  starts_at timestamptz,
  ends_at timestamptz,
  expires_at timestamptz,
  published_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
begin
  return query
    select
      n.id, n.user_id, n.currency, n.title, n.context, n.scope,
      n.related_stance_id, n.tags, n.visibility, n.status,
      n.starts_at, n.ends_at, n.expires_at,
      n.published_at, n.closed_at, n.created_at, n.updated_at
    from need_declarations n
    where n.user_id = target_user_id
      and (
        n.user_id = auth.uid()
        or (
          n.status in ('open', 'matched', 'fulfilled')
          and (
            n.visibility = 'public'
            or (
              n.visibility = 'connections_only'
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
    order by
      case n.status
        when 'open' then 1
        when 'matched' then 2
        when 'fulfilled' then 3
        when 'draft' then 4
        when 'closed' then 5
        when 'expired' then 6
      end,
      n.published_at desc nulls last,
      n.created_at desc;
end;
$$;

grant execute on function get_need_declarations_for_user(uuid) to authenticated;

drop function if exists get_manifest_for_user(uuid);

create or replace function get_manifest_for_user(target_user_id uuid)
returns table (
  manifest_id uuid,
  headline text,
  is_published boolean,
  last_reviewed_at timestamptz,
  manifest_created_at timestamptz,
  manifest_updated_at timestamptz,
  stance_id uuid,
  currency contribution_currency,
  title text,
  description text,
  tags text[],
  availability stance_availability,
  visibility stance_visibility,
  display_order smallint,
  stance_created_at timestamptz,
  stance_updated_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
begin
  return query
    select
      m.id, m.headline, m.is_published, m.last_reviewed_at,
      m.created_at, m.updated_at,
      s.id, s.currency, s.title, s.description, s.tags,
      s.availability, s.visibility, s.display_order,
      s.created_at, s.updated_at
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

grant execute on function get_manifest_for_user(uuid) to authenticated;

create or replace function expire_overdue_need_declarations()
returns integer
language plpgsql security definer set search_path = public
as $$
declare v_count integer;
begin
  with expired as (
    update need_declarations
      set status = 'expired'
      where status = 'open'
        and expires_at is not null
        and expires_at <= now()
      returning 1
  )
  select count(*) into v_count from expired;
  return coalesce(v_count, 0);
end;
$$;

revoke all on function expire_overdue_need_declarations() from public;
revoke all on function expire_overdue_need_declarations() from authenticated;