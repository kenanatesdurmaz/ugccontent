-- Credits granted this cycle is now stored explicitly (instead of always
-- being derived from the current plan's fixed amount), so switching plans
-- can add the new plan's credits on top of whatever's left rather than
-- discarding the remainder.

alter table subscriptions add column if not exists credits_granted numeric(10, 1);

update subscriptions set credits_granted = case plan
  when 'starter' then 65
  when 'creator' then 130
  when 'pro' then 260
end
where credits_granted is null;

alter table subscriptions alter column credits_granted set not null;
alter table subscriptions alter column credits_granted set default 0;
