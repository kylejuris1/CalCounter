-- Removes local credit ledger + webhook event log structures.
-- Run in Supabase SQL Editor.

begin;

-- Drop policy first (safe if already removed).
drop policy if exists "credit_transactions_select_own" on public.credit_transactions;

-- Drop function that depends on credit_transactions.
drop function if exists public.apply_credit_transaction(uuid, integer, text, text, jsonb);

-- Drop indexes explicitly (safe if they do not exist).
drop index if exists public.idx_credit_transactions_user_id;
drop index if exists public.idx_credit_transactions_created_at;
drop index if exists public.idx_revenuecat_events_created_at;
drop index if exists public.idx_revenuecat_events_processed;

-- Drop tables requested.
drop table if exists public.credit_transactions;
drop table if exists public.revenuecat_webhook_events;

commit;
