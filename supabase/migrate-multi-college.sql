-- Run this ONCE in Supabase (SQL Editor -> New query -> paste -> Run) on the database you already set up.
-- It adds colleges, links every profile and report to a college, and moves your existing data to DJ Sanghvi.
-- Safe to run twice.

-- 1. Colleges
create table if not exists public.colleges (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 3 and 150),
  city        text not null check (char_length(trim(city)) between 2 and 80),
  country     text not null default 'India',
  locations   text[] not null default array['Main gate','Canteen','Library','Ground','Parking','Classroom','Other'],
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create unique index if not exists colleges_name_city_uidx
  on public.colleges (lower(trim(name)), lower(trim(city)));

alter table public.colleges enable row level security;

drop policy if exists "colleges read all"     on public.colleges;
drop policy if exists "colleges insert own"   on public.colleges;

create policy "colleges read all"   on public.colleges for select using (true);
create policy "colleges insert own" on public.colleges for insert to authenticated with check (created_by = auth.uid());

-- 2. Your first college, with your campus places
insert into public.colleges (name, city, country, locations)
values (
  'Dwarkadas J. Sanghvi College of Engineering', 'Mumbai', 'India',
  array['Outer canteen','Inner canteen','Main gate','Canopy area','Library','Gym','Classroom']
)
on conflict do nothing;

-- 3. Link profiles and reports to a college
alter table public.profiles add column if not exists college_id uuid references public.colleges (id);
alter table public.items    add column if not exists college_id uuid references public.colleges (id);

update public.profiles
   set college_id = (select id from public.colleges where name like 'Dwarkadas J. Sanghvi%' limit 1)
 where college_id is null;

update public.items
   set college_id = (select id from public.colleges where name like 'Dwarkadas J. Sanghvi%' limit 1)
 where college_id is null;

alter table public.profiles alter column college_id set not null;
alter table public.items    alter column college_id set not null;

create index if not exists items_college_status_created_idx on public.items (college_id, status, created_at desc);

-- 4. Other colleges have different branches, years and campus places, so drop the DJ Sanghvi only checks
alter table public.profiles drop constraint if exists profiles_branch_check;
alter table public.profiles drop constraint if exists profiles_year_check;
alter table public.items    drop constraint if exists items_location_check;

-- Any place with "classroom" in its name needs a room number
alter table public.items drop constraint if exists classroom_needs_number;
alter table public.items add constraint classroom_needs_number
  check (location !~* 'classroom' or coalesce(trim(classroom_no), '') <> '');

-- 5. A report can only be posted to the poster's own college
drop policy if exists "items insert own" on public.items;
create policy "items insert own" on public.items for insert to authenticated
  with check (
    auth.uid() = user_id
    and college_id = (select p.college_id from public.profiles p where p.id = auth.uid())
  );
