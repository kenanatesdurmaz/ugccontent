-- Credits are now charged at a per-second rate rounded to the nearest
-- half-credit (e.g. 4.5, 6.5), so credits_used needs decimal precision.

alter table subscriptions
  alter column credits_used type numeric(10, 1) using credits_used::numeric(10, 1);

alter table subscriptions
  alter column credits_used set default 0;
