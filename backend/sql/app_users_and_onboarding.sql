-- App users (guests and linked accounts) + onboarding responses.
-- Run after supabase_credits.sql (provides set_updated_at()). Uses existing auth.users for logged-in users.

create extension if not exists "pgcrypto";

-- App user: guest (auth_user_id null) or linked to auth.users after email OTP sign-in
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.app_users is 'One row per app user. Guest until auth_user_id is set (after email OTP link).';

-- Onboarding responses: one row per app user, all onboarding answers + computed goals
create table if not exists public.onboarding_responses (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  -- Demographics / preferences
  gender text,
  workouts_per_week int,
  where_heard text,
  tried_other_apps boolean,
  -- Body
  weight_kg numeric,
  height_cm numeric,
  birth_date date,
  -- Goals
  goal text,
  desired_weight numeric,
  desired_weight_unit text,
  weight_loss_speed_per_week numeric,
  obstacles jsonb,
  diet text,
  accomplish text,
  -- Settings
  rollover_calories boolean,
  add_burned_calories_to_goal boolean,
  notifications_enabled boolean,
  referral_code text,
  -- Computed goals (from onboarding)
  calorie_goal int,
  protein_goal int,
  carbs_goal int,
  fat_goal int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.onboarding_responses is 'Onboarding answers and computed goals per user (guest or linked).';

-- Triggers for updated_at
drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at
  before update on public.app_users
  for each row execute function public.set_updated_at();

drop trigger if exists trg_onboarding_responses_updated_at on public.onboarding_responses;
create trigger trg_onboarding_responses_updated_at
  before update on public.onboarding_responses
  for each row execute function public.set_updated_at();

-- RLS: app_users and onboarding_responses are written by backend (service role).
-- Optionally allow authenticated users to read their own linked row.
alter table public.app_users enable row level security;
alter table public.onboarding_responses enable row level security;

-- Authenticated users can read their own app_user row (when linked)
drop policy if exists "app_users_select_own" on public.app_users;
create policy "app_users_select_own"
  on public.app_users
  for select
  to authenticated
  using (auth_user_id = auth.uid());

-- Authenticated users can read their own onboarding row
drop policy if exists "onboarding_responses_select_own" on public.onboarding_responses;
create policy "onboarding_responses_select_own"
  on public.onboarding_responses
  for select
  to authenticated
  using (
    user_id in (select id from public.app_users where auth_user_id = auth.uid())
  );

-- No insert/update/delete policies for client: backend uses service role.
