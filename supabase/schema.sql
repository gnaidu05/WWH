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
  avatar_url  text,                                 -- profile picture (public URL)
  created_at  timestamptz not null default now()
);
alter table public.profiles add column if not exists avatar_url text;

-- ---------- BOOKS ----------------------------------------------------------
create table if not exists public.books (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references auth.users (id) on delete cascade,
  author_name text not null default 'Unknown author',
  title       text not null,
  genre       text not null default 'Fiction',
  language    text not null default 'English',
  price       integer not null default 0,
  cover_idx   integer not null default 0,           -- 0..5, fallback cover gradient
  cover_url   text,                                  -- uploaded cover image (public URL)
  isbn        text,                                  -- ISBN-10 / ISBN-13 for tracking
  buy_url     text,                                  -- (legacy) single marketplace link
  buy_urls    text[],                                -- marketplace links (Amazon, Flipkart, …)
  description text,
  created_at  timestamptz not null default now()
);
-- Add the newer columns if the table already existed from an earlier run:
alter table public.books add column if not exists cover_url text;
alter table public.books add column if not exists isbn text;
alter table public.books add column if not exists buy_url text;
alter table public.books add column if not exists buy_urls text[];
create index if not exists books_author_idx on public.books (author_id);
create index if not exists books_created_idx on public.books (created_at desc);
create index if not exists books_isbn_idx on public.books (isbn);

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
  image_url   text,                                  -- event banner (public URL)
  link_url    text,                                  -- registration / join link (online)
  format      text,                                  -- In-person | Online | Hybrid
  venue       text,                                  -- venue name & address (in-person)
  created_at  timestamptz not null default now()
);
alter table public.events add column if not exists image_url text;
alter table public.events add column if not exists link_url text;
alter table public.events add column if not exists format text;
alter table public.events add column if not exists venue text;
create index if not exists events_host_idx on public.events (host_id);
create index if not exists events_date_idx on public.events (event_date);

-- ---------- EVENT RSVPs -----------------------------------------------------
-- One RSVP per person per event. Counts are public; you manage your own.
create table if not exists public.event_rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  status     text not null check (status in ('coming', 'maybe', 'interested')),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create index if not exists rsvps_event_idx on public.event_rsvps (event_id);
alter table public.event_rsvps enable row level security;
drop policy if exists "rsvps are public" on public.event_rsvps;
create policy "rsvps are public" on public.event_rsvps for select using (true);
drop policy if exists "insert own rsvp" on public.event_rsvps;
create policy "insert own rsvp" on public.event_rsvps for insert with check (auth.uid() = user_id);
drop policy if exists "update own rsvp" on public.event_rsvps;
create policy "update own rsvp" on public.event_rsvps for update using (auth.uid() = user_id);
drop policy if exists "delete own rsvp" on public.event_rsvps;
create policy "delete own rsvp" on public.event_rsvps for delete using (auth.uid() = user_id);

-- ---------- REVIEWS & RATINGS ----------------------------------------------
-- One review per reader per book (they can edit it). Public to read.
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid not null references public.books (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id) on delete cascade,
  reviewer_name text not null default 'Reader',
  rating      integer not null check (rating between 1 and 5),
  body        text,
  created_at  timestamptz not null default now(),
  unique (book_id, reviewer_id)
);
create index if not exists reviews_book_idx on public.reviews (book_id);
alter table public.reviews enable row level security;
drop policy if exists "reviews are public" on public.reviews;
create policy "reviews are public" on public.reviews for select using (true);
drop policy if exists "insert own review" on public.reviews;
create policy "insert own review" on public.reviews for insert with check (auth.uid() = reviewer_id);
drop policy if exists "update own review" on public.reviews;
create policy "update own review" on public.reviews for update using (auth.uid() = reviewer_id);
drop policy if exists "delete own review" on public.reviews;
create policy "delete own review" on public.reviews for delete using (auth.uid() = reviewer_id);

-- ---------- PARTNER QUOTATIONS ---------------------------------------------
-- Publishers / distributors / reviewers post service quotations.
create table if not exists public.quotes (
  id           uuid primary key default gen_random_uuid(),
  partner_id   uuid not null references auth.users (id) on delete cascade,
  partner_name text not null default 'Partner',
  kind         text not null default 'Publisher',   -- Publisher | Distributor | Reviewer
  title        text,                                 -- e.g. "Full publishing package"
  price        text,                                 -- "₹35,000" or "12%"
  unit         text,                                 -- "full package", "per sale"
  items        text[],                               -- bullet points
  created_at   timestamptz not null default now()
);
create index if not exists quotes_partner_idx on public.quotes (partner_id);
alter table public.quotes enable row level security;
drop policy if exists "quotes are public" on public.quotes;
create policy "quotes are public" on public.quotes for select using (true);
drop policy if exists "insert own quote" on public.quotes;
create policy "insert own quote" on public.quotes for insert with check (auth.uid() = partner_id);
drop policy if exists "update own quote" on public.quotes;
create policy "update own quote" on public.quotes for update using (auth.uid() = partner_id);
drop policy if exists "delete own quote" on public.quotes;
create policy "delete own quote" on public.quotes for delete using (auth.uid() = partner_id);

-- ---------- CONTACT MESSAGES -----------------------------------------------
-- Anyone (even signed-out visitors) can send a message; only the project
-- owner can read them (in the Supabase dashboard / via the service role).
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       text,
  subject     text,
  body        text not null,
  created_at  timestamptz not null default now()
);
alter table public.messages enable row level security;
drop policy if exists "anyone can send a message" on public.messages;
create policy "anyone can send a message" on public.messages
  for insert to anon, authenticated with check (true);
-- (No SELECT policy on purpose: messages are not publicly readable.)

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

-- ---------- STORAGE: book cover images -------------------------------------
-- Public bucket so covers can be shown to anyone; uploads restricted to the
-- signed-in owner (files live under a folder named after their user id).
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists "cover images are public" on storage.objects;
create policy "cover images are public" on storage.objects
  for select using (bucket_id = 'covers');

drop policy if exists "upload own covers" on storage.objects;
create policy "upload own covers" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "update own covers" on storage.objects;
create policy "update own covers" on storage.objects
  for update to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "delete own covers" on storage.objects;
create policy "delete own covers" on storage.objects
  for delete to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- STORAGE: profile pictures --------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars are public" on storage.objects;
create policy "avatars are public" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "upload own avatar" on storage.objects;
create policy "upload own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "update own avatar" on storage.objects;
create policy "update own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "delete own avatar" on storage.objects;
create policy "delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- STORAGE: event images ------------------------------------------
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

drop policy if exists "event images are public" on storage.objects;
create policy "event images are public" on storage.objects
  for select using (bucket_id = 'event-images');

drop policy if exists "upload own event image" on storage.objects;
create policy "upload own event image" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "update own event image" on storage.objects;
create policy "update own event image" on storage.objects
  for update to authenticated
  using (bucket_id = 'event-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "delete own event image" on storage.objects;
create policy "delete own event image" on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-images' and (storage.foldername(name))[1] = auth.uid()::text);
