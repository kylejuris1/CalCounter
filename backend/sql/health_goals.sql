-- Health goals: computed from onboarding_responses (BMR, TDEE, macros, fiber, etc.).
-- Run after app_users_and_onboarding.sql.

create table if not exists public.health_goals (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  calorie_goal int not null,
  protein_grams numeric not null,
  fat_grams numeric not null,
  carbs_grams numeric not null,
  fiber_grams numeric not null,
  sugar_grams numeric not null,
  sodium_mg int not null,
  water_liters numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.health_goals is 'Computed daily goals (calories, macros, fiber, sugar, sodium, water) from onboarding.';

-- Optional: trigger to keep updated_at in sync (if set_updated_at exists)
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on p.pronamespace = n.oid where n.nspname = 'public' and p.proname = 'set_updated_at') then
    drop trigger if exists trg_health_goals_updated_at on public.health_goals;
    create trigger trg_health_goals_updated_at
      before update on public.health_goals
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.health_goals enable row level security;

-- Backend uses service role; optionally allow users to read their own
drop policy if exists "health_goals_select_own" on public.health_goals;
create policy "health_goals_select_own"
  on public.health_goals
  for select
  to authenticated
  using (
    user_id in (select id from public.app_users where auth_user_id = auth.uid())
  );
