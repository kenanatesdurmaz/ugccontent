-- Idempotency ledger for Gumroad "Ping" webhook events. Gumroad retries a
-- ping if we don't answer 200 fast enough, and a subscription's recurring
-- charges reuse the same subscription_id across multiple distinct sale_ids
-- — `sale_id` uniquely identifies one specific charge, so a unique
-- constraint on it guarantees a given charge can never grant credits twice,
-- the same pattern used for admin_notifications.event_id.
create table if not exists gumroad_sales (
  id uuid primary key default gen_random_uuid(),
  sale_id text not null unique,
  gumroad_subscription_id text,
  -- Nullable: a sale we can't attribute to a user (missing/invalid
  -- url_params) still gets logged here for manual reconciliation rather
  -- than silently dropped.
  clerk_user_id text,
  plan text check (plan in ('starter', 'creator', 'pro')),
  price_cents int not null,
  currency text not null,
  raw jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_gumroad_sales_clerk_user_id on gumroad_sales(clerk_user_id);
create index if not exists idx_gumroad_sales_gumroad_subscription_id on gumroad_sales(gumroad_subscription_id);
