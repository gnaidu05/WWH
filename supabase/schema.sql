-- ============================================================================
-- Kalam — Supabase schema
-- Run this once in your Supabase project:  Dashboard → SQL Editor → New query
-- → paste this whole file → Run.  Safe to re-run (idempotent-ish).
-- ============================================================================

-- ---------- PROFILES -------------------------------------------------------
-- One row per user, linked to auth.users. Auto-created on signup by a trigger
-- that reads the metadata passed to supabase.auth.signUp({ options: { data }}).
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default 'New member',
  role        text not null default 'Reader',      -- Author | Publisher | Distributor | Reviewer | Reader
  city        text,
  language    text,
  org         text,
  bio         text,
  created_at  timestamptz not null default now()
);

-- ---------- BOOKS ----------------------------------------------------------
create table if not exists public.books (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references auth.users (id) on delete cascade,
  author_name text not null default 'Unknown author',
  title       text not null,
  genre       text not null default 'Fiction',
  language    text not null default 'English',
  price       integer not null default 0,
  cover_idx   integer not null default 0,           -- 0..5, picks a cover gradient
  description text,
  created_at  timestamptz not null default now()
);
create index if not exists books_author_idx on public.books (author_id);
create index if not exists books_created_idx on public.books (created_at desc);

-- ---------- EVENTS ---------------------------------------------------------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  host_id     uuid not null references auth.users (id) on delete cascade,
  host_name   text not null default 'Host',
  type        text not null default 'Reading',       -- Book Launch | Reading | AMA | Workshop | Panel | Book Club
  title       text not null,
  event_date  date not null,
  event_time  text,
  mode        text,                                  -- e.g. "Bengaluru · In-person" or "Online"
  description text,
  created_at  timestamptz not null default now()
);
create index if not exists events_host_idx on public.events (host_id);
create index if not exists events_date_idx on public.events (event_date);

-- ---------- AUTO-CREATE PROFILE ON SIGNUP ----------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, city, language, org, bio)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New member'),
    coalesce(new.raw_user_meta_data ->> 'role', 'Reader'),
    new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'language',
    new.raw_user_meta_data ->> 'org',
    new.raw_user_meta_data ->> 'bio'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- ROW LEVEL SECURITY ---------------------------------------------
alter table public.profiles enable row level security;
alter table public.books    enable row level security;
alter table public.events   enable row level security;

-- Profiles: anyone can read (public author directory); you edit only your own.
drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles for select using (true);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Books: anyone can read; only the owner can write.
drop policy if exists "books are public" on public.books;
create policy "books are public" on public.books for select using (true);

drop policy if exists "insert own books" on public.books;
create policy "insert own books" on public.books for insert with check (auth.uid() = author_id);

drop policy if exists "update own books" on public.books;
create policy "update own books" on public.books for update using (auth.uid() = author_id);

drop policy if exists "delete own books" on public.books;
create policy "delete own books" on public.books for delete using (auth.uid() = author_id);

-- Events: anyone can read; only the host can write.
drop policy if exists "events are public" on public.events;
create policy "events are public" on public.events for select using (true);

drop policy if exists "insert own events" on public.events;
create policy "insert own events" on public.events for insert with check (auth.uid() = host_id);

drop policy if exists "update own events" on public.events;
create policy "update own events" on public.events for update using (auth.uid() = host_id);

drop policy if exists "delete own events" on public.events;
create policy "delete own events" on public.events for delete using (auth.uid() = host_id);
