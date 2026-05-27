-- Run this in Supabase SQL editor (fresh project).

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dob text not null unique check (dob ~ '^\d{8}$'),
  gender text not null check (gender in ('male', 'female')),
  parent_name text null,
  created_at timestamptz not null default now()
);

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quantity_remaining integer not null check (quantity_remaining >= 0),
  gender text not null check (gender in ('male', 'female', 'unisex')),
  image_url text null,
  created_at timestamptz not null default now()
);

create table if not exists public.spins (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete restrict,
  gift_id uuid not null references public.gifts(id) on delete restrict,
  created_at timestamptz not null default now(),
  screenshot_path text null,
  screenshot_url text null,
  constraint spins_one_per_child unique (child_id)
);

create or replace function public.spin_for_dob(p_dob text)
returns table (spin_id uuid, child_name text, gift_name text)
language plpgsql
as $$
declare
  v_child public.children%rowtype;
  v_gift public.gifts%rowtype;
  v_spin_id uuid;
begin
  select * into v_child
  from public.children
  where dob = p_dob
  limit 1;

  if not found then
    raise exception 'child_not_found';
  end if;

  if exists (select 1 from public.spins s where s.child_id = v_child.id) then
    raise exception 'already_spun';
  end if;

  select * into v_gift
  from public.gifts g
  where g.quantity_remaining > 0
    and (g.gender = v_child.gender or g.gender = 'unisex')
  order by random()
  limit 1
  for update skip locked;

  if not found then
    raise exception 'out_of_gifts';
  end if;

  update public.gifts
  set quantity_remaining = quantity_remaining - 1
  where id = v_gift.id;

  insert into public.spins (child_id, gift_id)
  values (v_child.id, v_gift.id)
  returning id into v_spin_id;

  return query
  select v_spin_id, v_child.name, v_gift.name;
end;
$$;
