-- ============================================================
-- VetrApply initial schema
-- Run via Supabase CLI or SQL editor against the NEW project.
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================
create type geo_market           as enum ('UK','US');
create type experience_level     as enum ('intern','junior','mid','senior','lead','exec');
create type work_authorization   as enum ('citizen','permanent_resident','visa_required','student');
create type ats_provider         as enum ('greenhouse','lever','workday','linkedin','other','manual');
create type job_status           as enum ('saved','dismissed','archived');
create type application_status   as enum ('saved','applied','interview','offer','rejected','withdrawn');
create type hotline_mode         as enum ('mock_interview','pep_talk','pipeline_review','debrief');
create type payment_plan         as enum ('free','pro','team');
create type payment_status       as enum ('active','past_due','canceled','trialing','none');

-- ============================================================
-- profiles (1:1 with auth.users)
-- ============================================================
create table profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text,
  target_role         text,
  location            text,
  geo_market          geo_market default 'UK',
  experience_level    experience_level,
  work_authorization  work_authorization,
  linkedin_url        text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- cvs
-- ============================================================
create table cvs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null default 'My CV',
  file_path   text not null,
  file_mime   text not null,
  raw_text    text not null,
  parsed      jsonb,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index cvs_user_active_idx on cvs (user_id, is_active);

-- ============================================================
-- jobs
-- ============================================================
create table jobs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  source_url    text,
  ats_provider  ats_provider not null default 'manual',
  company       text,
  title         text,
  location      text,
  raw_text      text not null,
  parsed        jsonb,
  status        job_status not null default 'saved',
  created_at    timestamptz not null default now()
);
create index jobs_user_status_idx on jobs (user_id, status);

-- ============================================================
-- application_packs
-- ============================================================
create table application_packs (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  cv_id                 uuid not null references cvs(id) on delete cascade,
  job_id                uuid not null references jobs(id) on delete cascade,
  tailored_summary      text,
  cover_letter          text,
  bullets               jsonb,
  application_questions jsonb,
  interview_prep        jsonb,
  follow_up_email       text,
  skills_gap            jsonb,
  input_hash            text not null,
  generated_by_model    text not null default 'gemini-2.5-pro',
  generation_cost_cents integer default 0,
  created_at            timestamptz not null default now(),
  unique (user_id, input_hash)
);
create index packs_user_job_idx on application_packs (user_id, job_id);

-- ============================================================
-- applications (tracker)
-- ============================================================
create table applications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  job_id       uuid not null references jobs(id) on delete cascade,
  pack_id      uuid references application_packs(id) on delete set null,
  status       application_status not null default 'saved',
  applied_at   timestamptz,
  interview_at timestamptz,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, job_id)
);
create index applications_user_status_idx on applications (user_id, status);

-- ============================================================
-- hotline (v1.1 scaffold)
-- ============================================================
create table hotline_calls (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  twilio_call_sid text unique,
  mode            hotline_mode,
  linked_job_id   uuid references jobs(id) on delete set null,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  summary         text,
  metadata        jsonb default '{}'::jsonb
);
create index hotline_calls_user_started_idx on hotline_calls (user_id, started_at desc);

create table call_transcripts (
  id      uuid primary key default gen_random_uuid(),
  call_id uuid not null references hotline_calls(id) on delete cascade,
  role    text not null check (role in ('user','assistant','system','tool')),
  content text not null,
  ts      timestamptz not null default now()
);
create index call_transcripts_call_ts_idx on call_transcripts (call_id, ts);

create table mock_interview_sessions (
  id         uuid primary key default gen_random_uuid(),
  call_id    uuid references hotline_calls(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  job_id     uuid references jobs(id) on delete set null,
  questions  jsonb not null default '[]'::jsonb,
  answers    jsonb not null default '[]'::jsonb,
  scores     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- payments (Stripe scaffold; not wired in MVP)
-- ============================================================
create table payments (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  plan               payment_plan not null default 'free',
  status             payment_status not null default 'none',
  current_period_end timestamptz,
  updated_at         timestamptz not null default now()
);

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end
$$ language plpgsql;

create trigger trg_profiles_updated     before update on profiles     for each row execute function set_updated_at();
create trigger trg_applications_updated before update on applications for each row execute function set_updated_at();
create trigger trg_payments_updated     before update on payments     for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles                enable row level security;
alter table cvs                     enable row level security;
alter table jobs                    enable row level security;
alter table application_packs       enable row level security;
alter table applications            enable row level security;
alter table hotline_calls           enable row level security;
alter table call_transcripts        enable row level security;
alter table mock_interview_sessions enable row level security;
alter table payments                enable row level security;

create policy "own_profile_rw"          on profiles              using (id = auth.uid())      with check (id = auth.uid());
create policy "own_cv_rw"               on cvs                   using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_jobs_rw"             on jobs                  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_packs_rw"            on application_packs     using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_apps_rw"             on applications          using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_hotline_calls_rw"    on hotline_calls         using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own_call_transcripts_rw" on call_transcripts
  using (exists (
    select 1 from hotline_calls hc
    where hc.id = call_transcripts.call_id and hc.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from hotline_calls hc
    where hc.id = call_transcripts.call_id and hc.user_id = auth.uid()
  ));

create policy "own_mock_sessions_rw" on mock_interview_sessions using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_payments_r"       on payments              for select using (user_id = auth.uid());
-- payments writes go through service role only (Stripe webhooks)

-- ============================================================
-- Storage bucket
-- Created via Supabase dashboard or CLI:
--   supabase storage create-bucket cvs --private
-- Path convention: {user_id}/{cv_id}.{ext}
-- ============================================================
