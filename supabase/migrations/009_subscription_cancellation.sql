-- Lets a user cancel their subscription without losing the period they
-- already paid for: cancel_at_period_end just stops the automatic
-- rollover in getSubscription() once renews_at is reached.

alter table subscriptions
  add column if not exists cancel_at_period_end boolean not null default false;
