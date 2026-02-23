-- Migrate app_users from credits to subscription model.
-- Run in Supabase SQL Editor. No credits columns; subscription status is via RevenueCat only.

begin;

-- 1. Drop credits columns and constraint from app_users
alter table public.app_users
  drop constraint if exists app_users_credits_balance_check;

alter table public.app_users
  drop column if exists credits_balance;

alter table public.app_users
  drop column if exists credits_updated_at;

comment on table public.app_users is 'App users; subscription (CalCounter Premium) is determined by RevenueCat entitlements, not stored here.';

commit;
