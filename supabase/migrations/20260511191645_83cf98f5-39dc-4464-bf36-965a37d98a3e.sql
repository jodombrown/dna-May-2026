create table if not exists public.dia_brief_snoozes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid not null,
  thread_type text not null check (thread_type in ('direct','group')),
  snoozed_until timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, thread_id, thread_type)
);

alter table public.dia_brief_snoozes enable row level security;

create policy "snooze self select" on public.dia_brief_snoozes
  for select to authenticated using (user_id = auth.uid());
create policy "snooze self insert" on public.dia_brief_snoozes
  for insert to authenticated with check (user_id = auth.uid());
create policy "snooze self update" on public.dia_brief_snoozes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "snooze self delete" on public.dia_brief_snoozes
  for delete to authenticated using (user_id = auth.uid());

create index if not exists idx_brief_snoozes_user_active
  on public.dia_brief_snoozes(user_id, snoozed_until desc);

create trigger trg_brief_snoozes_updated_at
  before update on public.dia_brief_snoozes
  for each row execute function public.update_updated_at_column();