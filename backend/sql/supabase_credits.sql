-- Supabase schema for secure credits handling with RevenueCat webhooks.
-- Run this in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);


create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_credits_updated_at on public.user_credits;
create trigger trg_user_credits_updated_at
before update on public.user_credits
for each row execute function public.set_updated_at();

-- Trigger on auth.users: must use set search_path = '' and qualified names
-- to avoid "database error saving new user". Insert only id into profiles
-- to avoid unique-email constraint failures during signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;

  insert into public.user_credits (user_id, balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
exception
  when others then
    -- Log but don't block signup; app uses app_users and ensure-app-user
    raise warning 'handle_new_user: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_credits enable row level security;

-- Read-only access for authenticated users to their own data.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "user_credits_select_own" on public.user_credits;
create policy "user_credits_select_own"
on public.user_credits
for select
to authenticated
using (auth.uid() = user_id);

-- Explicitly deny client writes by not creating insert/update/delete policies.

