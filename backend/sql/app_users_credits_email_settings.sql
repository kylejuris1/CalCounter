-- Add credits, email, and settings to app_users. Run after app_users table exists.
-- Connects payment system (credits_balance) and auth (email) to app_users.

-- Credits: balance stored on app_users for both guests and linked users
alter table public.app_users
  add column if not exists credits_balance integer not null default 0 check (credits_balance >= 0);

alter table public.app_users
  add column if not exists credits_updated_at timestamptz null;

-- Email: synced from auth.users when user links (auth_user_id set)
alter table public.app_users
  add column if not exists email text;

-- Settings: flexible JSON (e.g. notifications_enabled, theme, units)
alter table public.app_users
  add column if not exists settings jsonb not null default '{}';

comment on column public.app_users.credits_balance is 'Credits balance for purchases (RevenueCat).';
comment on column public.app_users.email is 'Email from auth.users when linked; null for guests.';
comment on column public.app_users.settings is 'User preferences (notifications, theme, etc.).';

-- Sync email from auth.users when auth_user_id is set or changed
create or replace function public.sync_app_user_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.auth_user_id is not null then
    select au.email into new.email
    from auth.users au
    where au.id = new.auth_user_id
    limit 1;
  else
    new.email := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_app_users_sync_email on public.app_users;
create trigger trg_app_users_sync_email
  before update on public.app_users
  for each row
  when (old.auth_user_id is distinct from new.auth_user_id)
  execute function public.sync_app_user_email_from_auth();

-- Set email on insert when auth_user_id is provided (e.g. ensure-app-user)
create or replace function public.sync_app_user_email_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.auth_user_id is not null then
    select au.email into new.email
    from auth.users au
    where au.id = new.auth_user_id
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_app_users_sync_email_insert on public.app_users;
create trigger trg_app_users_sync_email_insert
  before insert on public.app_users
  for each row
  execute function public.sync_app_user_email_on_insert();
