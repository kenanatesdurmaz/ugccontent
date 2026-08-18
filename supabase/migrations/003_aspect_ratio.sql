-- Adds a selectable video aspect ratio per generation.
alter table generations
  add column if not exists aspect_ratio text not null default '9:16'
    check (aspect_ratio in ('16:9', '9:16', '1:1'));
