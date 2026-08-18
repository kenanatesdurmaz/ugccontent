-- Optional reference photo of the person who should appear in the video,
-- so the same "presenter" can be reused across generations instead of a
-- new AI-generated persona each time.
alter table generations
  add column if not exists avatar_url text;
