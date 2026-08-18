-- Admin email notifications for successful subscriptions. `event_id` has a
-- unique constraint so the same event can never be recorded (and thus
-- never emailed) twice — the idempotency guarantee lives at the DB level,
-- not in application logic that could race.
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
