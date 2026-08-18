-- Adds a selectable video resolution per generation. Free plan is capped at
-- 720p; the app enforces this server-side too since there's no real billing
-- yet (see app/api/generations/route.ts).
alter table generations
  add column if not exists resolution text not null default '720p'
    check (resolution in ('720p', '1080p'));
