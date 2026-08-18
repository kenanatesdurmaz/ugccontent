-- Production safety layer for video generation:
--   - a global kill switch + live/test mode flag (app_settings, singleton row)
--   - per-generation audit fields (credit cost charged, fal.ai request id)

create table if not exists app_settings (
  id text primary key default 'global',
  generation_enabled boolean not null default true,
  mode text not null default 'live' check (mode in ('live', 'test')),
  updated_at timestamptz not null default now()
);

insert into app_settings (id) values ('global')
on conflict (id) do nothing;

alter table generations add column if not exists credit_cost numeric(10, 1);
alter table generations add column if not exists fal_request_id text;
