-- Run in Supabase SQL Editor.

alter table public.gifts
  add column if not exists image_url text null;
