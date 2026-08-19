-- Run once against your Supabase project (SQL editor or `supabase db push`).

create extension if not exists "pgcrypto";

create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  product_name text not null,
  product_image_url text not null,
  extra_product_image_urls text[] not null default '{}',
  custom_prompt text,
  avatar_url text,
  aspect_ratio text not null default '9:16'
    check (aspect_ratio in ('16:9', '9:16', '1:1')),
  resolution text not null default '720p'
    check (resolution in ('720p', '1080p')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  -- Audit fields (see migrations/011_production_safety.sql): the credit
  -- amount actually charged for this generation, and fal.ai's request id
  -- for the video job (mock_-prefixed when generated in test mode).
  credit_cost numeric(10, 1),
  fal_request_id text,
  created_at timestamptz not null default now()
);

create table if not exists generation_videos (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references generations(id) on delete cascade,
  script_index int not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  video_url text,
  created_at timestamptz not null default now(),
  unique (generation_id, script_index)
);

create index if not exists idx_generations_user on generations(clerk_user_id);
create index if not exists idx_generation_videos_generation on generation_videos(generation_id);

-- Real subscription + credit tracking (see migrations/007_subscriptions.sql,
-- migrations/008_fractional_credits.sql, migrations/009_subscription_cancellation.sql
-- and migrations/010_credits_granted.sql). Credits are charged at a
-- per-second rate rounded to the nearest half-credit, hence numeric(10,1).
-- credits_granted is stored (not derived from the plan) so switching plans
-- can add the new plan's credits on top of whatever's left.
create table if not exists subscriptions (
  clerk_user_id text primary key,
  plan text not null check (plan in ('starter', 'creator', 'pro')),
  credits_granted numeric(10, 1) not null default 0,
  credits_used numeric(10, 1) not null default 0,
  renews_at timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Global kill switch + live/test mode flag for video generation (see
-- migrations/011_production_safety.sql). Single row, id = 'global'.
create table if not exists app_settings (
  id text primary key default 'global',
  generation_enabled boolean not null default true,
  mode text not null default 'live' check (mode in ('live', 'test')),
  updated_at timestamptz not null default now()
);

insert into app_settings (id) values ('global')
on conflict (id) do nothing;

-- Admin email notifications for successful subscriptions (see
-- migrations/012_admin_notifications.sql). Unique event_id makes delivery
-- idempotent — the same event can never be recorded/emailed twice.
create table if not exists admin_notifications (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null check (event_type in ('subscription_created', 'test')),
  clerk_user_id text,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists idx_admin_notifications_status on admin_notifications(status);

-- Idempotency ledger for Gumroad "Ping" webhook events (see
-- migrations/013_gumroad_sales.sql). Unique sale_id makes credit granting
-- idempotent — a retried or duplicate ping can never grant credits twice.
create table if not exists gumroad_sales (
  id uuid primary key default gen_random_uuid(),
  sale_id text not null unique,
  gumroad_subscription_id text,
  clerk_user_id text,
  plan text check (plan in ('starter', 'creator', 'pro')),
  price_cents int not null,
  currency text not null,
  raw jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_gumroad_sales_clerk_user_id on gumroad_sales(clerk_user_id);
create index if not exists idx_gumroad_sales_gumroad_subscription_id on gumroad_sales(gumroad_subscription_id);

-- Storage buckets used by the app. Public read so <video>/<img> tags can
-- load directly; all writes go through the server (service role key), so
-- public read does not expose write access.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('generated-videos', 'generated-videos', true)
on conflict (id) do nothing;
