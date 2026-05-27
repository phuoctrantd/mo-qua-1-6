-- Run in Supabase SQL Editor.

alter table public.spins
  add column if not exists screenshot_url text null;
