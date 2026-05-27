-- Run in Supabase SQL Editor if tables already exist (from older schema.sql).

alter table public.children
  add column if not exists gender text;

alter table public.children
  add column if not exists parent_name text;

alter table public.gifts
  add column if not exists gender text;

alter table public.children
  drop constraint if exists children_gender_check;

alter table public.children
  add constraint children_gender_check
  check (gender is null or gender in ('male', 'female'));

alter table public.gifts
  drop constraint if exists gifts_gender_check;

alter table public.gifts
  add constraint gifts_gender_check
  check (gender is null or gender in ('male', 'female', 'unisex'));

-- After importing children/gifts with gender filled, optionally enforce NOT NULL:
-- alter table public.children alter column gender set not null;
-- alter table public.gifts alter column gender set not null;

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

  if v_child.gender is null then
    raise exception 'child_missing_gender';
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
