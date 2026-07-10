-- ============================================================================
-- Kitaab — Fresher Recruitment Engine schema
-- Run in your Supabase project after supabase/schema.sql:
-- Dashboard → SQL Editor → New query → paste this file → Run.
-- Safe to re-run (idempotent-ish, same convention as schema.sql).
--
-- Model: one row in recruitment_applications = one candidate applied to one
-- job. A candidate may hold several applications across jobs; each advances
-- independently. Applications move through five stages, in order, never
-- skipping; a failed gate puts them in a held/rejected status with the reason
-- recorded. The advance function enforces the gates server-side so a buggy or
-- malicious client cannot skip a stage or issue an LOI implicitly.
-- ============================================================================

-- ---------- JOBS -------------------------------------------------------------
create table if not exists public.recruitment_jobs (
  id          text primary key,                       -- e.g. 'JOB-SWE-26'
  title       text not null,
  -- Stage-gate criteria as JSON so cutoffs stay configurable per job:
  -- { degrees: [], branches: [], gradYears: [], minCgpa, assessmentCutoff,
  --   requiredRounds: [], requiredApprovals: [] }
  criteria    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ---------- APPLICATIONS -----------------------------------------------------
create table if not exists public.recruitment_applications (
  id             text primary key,                    -- e.g. 'APP-001'
  candidate_id   text not null,
  candidate_name text not null,
  email          text not null,
  job_id         text not null references public.recruitment_jobs (id) on delete cascade,
  stage          text not null default 'Application'
                 check (stage in ('Application','Assessment','Interview','Interim Offer','Letter of Intent')),
  status         text not null default 'active'
                 check (status in ('active','held','rejected','loi_issued')),
  status_reason  text,
  -- Evidence the stage gates read (shapes mirror assets/js/recruitment-engine.js):
  profile        jsonb not null default '{}'::jsonb,  -- degree, branch, gradYear, cgpa, applicationComplete
  assessment     jsonb not null default '{}'::jsonb,  -- invitedAt, completedAt, score
  interview      jsonb not null default '{"rounds":[]}'::jsonb,
  offer          jsonb not null default '{}'::jsonb,  -- extendedAt, accepted, acceptedAt, approvals[]
  loi            jsonb,                               -- issuedAt, issuedBy (terminal)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (candidate_id, job_id)                       -- one application per candidate per job
);
create index if not exists rec_apps_job_idx on public.recruitment_applications (job_id);
create index if not exists rec_apps_stage_idx on public.recruitment_applications (stage, status);

-- A held or rejected application must carry its reason — it never silently
-- disappears into a bare status.
alter table public.recruitment_applications
  drop constraint if exists rec_apps_reason_required;
alter table public.recruitment_applications
  add constraint rec_apps_reason_required
  check (status not in ('held','rejected') or (status_reason is not null and length(trim(status_reason)) > 0));

-- ---------- STAGE EVENTS (audit trail) ---------------------------------------
create table if not exists public.recruitment_stage_events (
  id           uuid primary key default gen_random_uuid(),
  app_id       text not null references public.recruitment_applications (id) on delete cascade,
  event        text not null,                          -- applied | advanced | held | released | rejected | loi_issued
  from_stage   text,
  to_stage     text,
  reason       text,
  actor        uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists rec_events_app_idx on public.recruitment_stage_events (app_id, created_at);

-- Log every stage/status change automatically so the trail can't be skipped.
create or replace function public.recruitment_log_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.recruitment_stage_events (app_id, event, to_stage, actor)
    values (new.id, 'applied', new.stage, auth.uid());
  elsif new.stage is distinct from old.stage then
    insert into public.recruitment_stage_events (app_id, event, from_stage, to_stage, actor)
    values (new.id, case when new.stage = 'Letter of Intent' then 'loi_issued' else 'advanced' end,
            old.stage, new.stage, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.recruitment_stage_events (app_id, event, from_stage, reason, actor)
    values (new.id,
            case new.status when 'held' then 'held' when 'rejected' then 'rejected' else 'released' end,
            new.stage, new.status_reason, auth.uid());
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rec_apps_log_insert on public.recruitment_applications;
create trigger rec_apps_log_insert
  after insert on public.recruitment_applications
  for each row execute function public.recruitment_log_change();

drop trigger if exists rec_apps_log_update on public.recruitment_applications;
create trigger rec_apps_log_update
  before update on public.recruitment_applications
  for each row execute function public.recruitment_log_change();

-- ---------- STAGE ORDER GUARD -------------------------------------------------
-- Stages move forward one step at a time — never skip, never regress. The LOI
-- stage additionally requires an accepted offer and a recorded loi payload,
-- so it cannot be reached by a generic "bump the stage" update.
create or replace function public.recruitment_guard_stage()
returns trigger
language plpgsql
as $$
declare
  ord constant text[] := array['Application','Assessment','Interview','Interim Offer','Letter of Intent'];
  oi int; ni int;
begin
  oi := array_position(ord, old.stage);
  ni := array_position(ord, new.stage);
  if ni is null then
    raise exception 'Unknown stage %', new.stage;
  end if;
  if ni <> oi and ni <> oi + 1 then
    raise exception 'Stage may only advance one step: % → % is not allowed', old.stage, new.stage;
  end if;
  if new.stage = 'Letter of Intent' and old.stage <> new.stage then
    if coalesce((new.offer ->> 'accepted')::boolean, false) is not true then
      raise exception 'LOI requires an accepted interim offer';
    end if;
    if new.loi is null or new.loi ->> 'issuedAt' is null then
      raise exception 'LOI requires an explicit loi payload (issuedAt/issuedBy)';
    end if;
    new.status := 'loi_issued';
  end if;
  return new;
end;
$$;

drop trigger if exists rec_apps_guard_stage on public.recruitment_applications;
create trigger rec_apps_guard_stage
  before update of stage on public.recruitment_applications
  for each row execute function public.recruitment_guard_stage();

-- ---------- ROW LEVEL SECURITY -------------------------------------------------
-- Recruitment data is internal: only signed-in users whose profile role is
-- 'Recruiter' can read or write it. Nothing here is publicly readable.
alter table public.recruitment_jobs         enable row level security;
alter table public.recruitment_applications enable row level security;
alter table public.recruitment_stage_events enable row level security;

create or replace function public.is_recruiter()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'Recruiter');
$$;

drop policy if exists "recruiters read jobs" on public.recruitment_jobs;
create policy "recruiters read jobs" on public.recruitment_jobs
  for select using (public.is_recruiter());
drop policy if exists "recruiters write jobs" on public.recruitment_jobs;
create policy "recruiters write jobs" on public.recruitment_jobs
  for all using (public.is_recruiter()) with check (public.is_recruiter());

drop policy if exists "recruiters read applications" on public.recruitment_applications;
create policy "recruiters read applications" on public.recruitment_applications
  for select using (public.is_recruiter());
drop policy if exists "recruiters write applications" on public.recruitment_applications;
create policy "recruiters write applications" on public.recruitment_applications
  for all using (public.is_recruiter()) with check (public.is_recruiter());

drop policy if exists "recruiters read events" on public.recruitment_stage_events;
create policy "recruiters read events" on public.recruitment_stage_events
  for select using (public.is_recruiter());
-- Events are written only by the triggers (security definer); no direct
-- insert/update/delete policies on purpose.
