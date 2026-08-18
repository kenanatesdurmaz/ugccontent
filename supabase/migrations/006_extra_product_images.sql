-- Optional additional product photos (e.g. other angles, the interior of a
-- wallet/bag) beyond the required primary product_image_url. All of them
-- get passed as reference images to the opening-frame generation step.
alter table generations
  add column if not exists extra_product_image_urls text[] not null default '{}';
