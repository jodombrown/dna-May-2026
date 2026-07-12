-- Server-side geocode cache (BD089). The composer's geocode moved off the
-- browser into the geocode-city edge function; this table lets a repeat lookup
-- of the same city skip a second Nominatim request, keeping us well inside
-- Nominatim's fair-use policy (it rate-limits by IP and discourages direct
-- application traffic from the browser).
create table if not exists public.geocode_cache (
  query text primary key,
  city text,
  country text,
  country_code text,
  lat numeric not null,
  lng numeric not null,
  display_name text,
  created_at timestamptz not null default now()
);

comment on table public.geocode_cache is
  'Server-side cache of successful Nominatim geocodes, keyed on the normalized "city, country" query (BD089). Written only by the geocode-city edge function via the service role; never read or written by clients.';

-- Server-only table: RLS on with zero policies denies all anon/authenticated
-- access. The edge function reaches it with the service role, which bypasses RLS.
alter table public.geocode_cache enable row level security;
