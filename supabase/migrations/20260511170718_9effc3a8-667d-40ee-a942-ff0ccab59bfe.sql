-- Phase 13 - DIA messaging quality loop

create table if not exists public.dia_messaging_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  smart_replies_enabled boolean not null default true,
  summaries_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dia_messaging_prefs enable row level security;

create policy "prefs self select" on public.dia_messaging_prefs
  for select to authenticated using (user_id = auth.uid());
create policy "prefs self insert" on public.dia_messaging_prefs
  for insert to authenticated with check (user_id = auth.uid());
create policy "prefs self update" on public.dia_messaging_prefs
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.dia_messaging_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null,
  surface text not null check (surface in ('smart_reply','summary','action_item')),
  helpful boolean not null,
  ref_id text,
  model text,
  variant text,
  created_at timestamptz not null default now()
);

alter table public.dia_messaging_feedback enable row level security;
create index if not exists idx_dia_feedback_user on public.dia_messaging_feedback(user_id, created_at desc);

create policy "feedback self insert" on public.dia_messaging_feedback
  for insert to authenticated with check (user_id = auth.uid());
create policy "feedback self select" on public.dia_messaging_feedback
  for select to authenticated using (user_id = auth.uid());

create table if not exists public.dia_messaging_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null,
  event_type text not null check (event_type in (
    'suggestion_shown','suggestion_picked','suggestion_sent',
    'summary_opened','summary_refreshed','action_item_clicked',
    'prefs_changed'
  )),
  ref_id text,
  model text,
  variant text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.dia_messaging_events enable row level security;
create index if not exists idx_dia_events_user on public.dia_messaging_events(user_id, created_at desc);
create index if not exists idx_dia_events_conv on public.dia_messaging_events(conversation_id, created_at desc);

create policy "events self insert" on public.dia_messaging_events
  for insert to authenticated with check (user_id = auth.uid());
create policy "events self select" on public.dia_messaging_events
  for select to authenticated using (user_id = auth.uid());

-- updated_at trigger for prefs
create or replace function public.dia_prefs_touch()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_dia_prefs_touch on public.dia_messaging_prefs;
create trigger trg_dia_prefs_touch before update on public.dia_messaging_prefs
  for each row execute function public.dia_prefs_touch();