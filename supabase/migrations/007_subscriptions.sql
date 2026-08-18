-- Real (Supabase-backed) subscription + credit tracking, replacing the
-- old client-only localStorage "fake subscribed" flag.

create table if not exists subscriptions (
  clerk_user_id text primary key,
  plan text not null check (plan in ('starter', 'creator', 'pro')),
  credits_used int not null default 0,
  renews_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
