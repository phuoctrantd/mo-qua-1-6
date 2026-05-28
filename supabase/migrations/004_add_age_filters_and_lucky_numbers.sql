-- Add age filters for lucky numbers (stored in public.gifts.name)
-- Run in Supabase SQL Editor.

alter table public.gifts
  add column if not exists min_age integer;

alter table public.gifts
  add column if not exists max_age integer;

alter table public.gifts
  drop constraint if exists gifts_min_age_check;
alter table public.gifts
  add constraint gifts_min_age_check check (min_age is null or min_age >= 0);

alter table public.gifts
  drop constraint if exists gifts_max_age_check;
alter table public.gifts
  add constraint gifts_max_age_check check (max_age is null or max_age >= 0);

alter table public.gifts
  drop constraint if exists gifts_age_range_check;
alter table public.gifts
  add constraint gifts_age_range_check check (
    min_age is null or max_age is null or min_age <= max_age
  );

-- Lucky number selection logic: still uses public.gifts, but filters by gender + age + quantity.
create or replace function public.spin_for_dob(p_dob text)
returns table (spin_id uuid, child_name text, gift_name text)
language plpgsql
as $$
declare
  v_child public.children%rowtype;
  v_gift public.gifts%rowtype;
  v_spin_id uuid;
  v_birth_date date;
  v_age_years integer;
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

  v_birth_date := to_date(p_dob, 'DDMMYYYY');
  v_age_years := date_part('year', age(current_date, v_birth_date))::int;

  select * into v_gift
  from public.gifts g
  where g.quantity_remaining > 0
    and (g.gender = v_child.gender or g.gender = 'unisex')
    and (g.min_age is null or v_age_years >= g.min_age)
    and (g.max_age is null or v_age_years <= g.max_age)
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

