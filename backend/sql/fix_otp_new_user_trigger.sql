-- Fix "database error saving new user" when sending OTP.
-- Supabase Auth runs a trigger after insert on auth.users. If that trigger inserts into
-- profiles/user_credits and those tables are missing or fail, you get this error.
-- This replaces the trigger to insert into app_users only (used by this app).

-- Replace handle_new_user so new auth users get an app_users row (no profiles/user_credits).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.app_users (id, auth_user_id)
  values (new.id, new.id)
  on conflict (id) do update set auth_user_id = excluded.auth_user_id;
  return new;
exception
  when others then
    raise warning 'handle_new_user: %', sqlerrm;
    return new;
end;
$$;

-- Ensure trigger exists on auth.users (idempotent)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
