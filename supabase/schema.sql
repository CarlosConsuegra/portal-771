create extension if not exists "pgcrypto";

create table if not exists public.maps (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  titulo text not null,
  image_url text not null,
  created_at timestamptz not null default now()
);

alter table public.maps enable row level security;

drop policy if exists "maps are public" on public.maps;
create policy "maps are public"
on public.maps
for select
using (true);

drop policy if exists "authenticated users can insert maps" on public.maps;
create policy "authenticated users can insert maps"
on public.maps
for insert
to authenticated
with check (true);

drop policy if exists "authenticated users can update maps" on public.maps;
create policy "authenticated users can update maps"
on public.maps
for update
to authenticated
using (true)
with check (true);

create table if not exists public.portales (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  titulo text not null,
  narrativa text not null,
  mapa_id text not null,
  marker_x numeric not null,
  marker_y numeric not null,
  lat numeric null,
  lng numeric null,
  image_url text not null,
  media_type text not null default 'image_2d',
  youtube_video_id text null,
  audio_url text null,
  status text not null,
  created_at timestamptz not null default now()
);

alter table public.portales
add column if not exists image_360_url text null;

alter table public.portales
add column if not exists video_360_url text null;

alter table public.portales
add column if not exists media_type text not null default 'image_2d';

alter table public.portales
add column if not exists youtube_video_id text null;

update public.portales
set media_type = 'image_360'
where image_360_url is not null
  and coalesce(media_type, 'image_2d') = 'image_2d';

alter table public.portales enable row level security;

drop policy if exists "published portales are public" on public.portales;
create policy "published portales are public"
on public.portales
for select
using (
  status = 'published' or auth.role() = 'authenticated'
);

drop policy if exists "authenticated users can insert portales" on public.portales;
create policy "authenticated users can insert portales"
on public.portales
for insert
to authenticated
with check (true);

drop policy if exists "authenticated users can update portales" on public.portales;
create policy "authenticated users can update portales"
on public.portales
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated users can delete portales" on public.portales;
create policy "authenticated users can delete portales"
on public.portales
for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "public can read portal assets" on storage.objects;
create policy "public can read portal assets"
on storage.objects
for select
using (bucket_id = 'images');

drop policy if exists "authenticated can upload portal assets" on storage.objects;
create policy "authenticated can upload portal assets"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'images');

drop policy if exists "authenticated can update portal assets" on storage.objects;
create policy "authenticated can update portal assets"
on storage.objects
for update
to authenticated
using (bucket_id = 'images')
with check (bucket_id = 'images');

drop policy if exists "authenticated can delete portal assets" on storage.objects;
create policy "authenticated can delete portal assets"
on storage.objects
for delete
to authenticated
using (bucket_id = 'images');

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  correo text not null,
  mensaje text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "anyone can insert contact messages" on public.contact_messages;
create policy "anyone can insert contact messages"
on public.contact_messages
for insert
to anon, authenticated
with check (true);

create table if not exists public.contact_rate_limit_events (
  id bigint generated always as identity primary key,
  identifier_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists contact_rate_limit_events_identifier_hash_created_at_idx
on public.contact_rate_limit_events (identifier_hash, created_at desc);

alter table public.contact_rate_limit_events enable row level security;

create or replace function public.check_contact_rate_limit(
  p_identifier_hash text,
  p_window_seconds integer default 3600,
  p_max_attempts integer default 3
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt_count integer;
  v_cutoff timestamptz;
begin
  if p_identifier_hash is null or btrim(p_identifier_hash) = '' then
    return true;
  end if;

  v_cutoff := now() - make_interval(secs => p_window_seconds);

  delete from public.contact_rate_limit_events
  where created_at < v_cutoff;

  select count(*)
  into v_attempt_count
  from public.contact_rate_limit_events
  where identifier_hash = p_identifier_hash
    and created_at >= v_cutoff;

  if v_attempt_count >= p_max_attempts then
    return false;
  end if;

  insert into public.contact_rate_limit_events (identifier_hash)
  values (p_identifier_hash);

  return true;
end;
$$;

grant execute on function public.check_contact_rate_limit(text, integer, integer) to anon, authenticated;
