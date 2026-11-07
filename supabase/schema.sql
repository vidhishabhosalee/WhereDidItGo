-- WhereDidItGo database for a NEW Supabase project (multi-college).
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Already ran an older version of this file? Run supabase/migrate-multi-college.sql instead.

-- 1. Colleges (anyone can read; a logged-in student can add their own)
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

insert into public.colleges (name, city, country, locations)
values (
  'Dwarkadas J. Sanghvi College of Engineering', 'Mumbai', 'India',
  array['Outer canteen','Inner canteen','Main gate','Canopy area','Library','Gym','Classroom']
)
on conflict do nothing;

-- 2. Student profiles (private: each student can only read their own row)
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  college_id  uuid not null references public.colleges (id),
  full_name   text not null,
  branch      text not null,
  year        text not null,
  email       text not null,
  phone       text not null,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles read own"   on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;

create policy "profiles read own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

-- 3. Lost and found reports (readable by everyone, writable only by the owner)
create table if not exists public.items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  college_id     uuid not null references public.colleges (id),
  type           text not null check (type in ('lost','found')),
  name           text not null,
  category       text not null,
  brand          text not null default '',
  colour         text not null,
  location       text not null,
  classroom_no   text,
  item_date      date not null,
  item_time      time,
  description    text not null default '',
  photo_url      text,
  contact_name   text not null,
  contact_phone  text not null,
  status         text not null default 'active' check (status in ('active','returned')),
  created_at     timestamptz not null default now(),
  constraint classroom_needs_number check (location !~* 'classroom' or coalesce(trim(classroom_no), '') <> '')
);

create index if not exists items_college_status_created_idx on public.items (college_id, status, created_at desc);

alter table public.items enable row level security;

drop policy if exists "items read all"     on public.items;
drop policy if exists "items insert own"   on public.items;
drop policy if exists "items update own"   on public.items;
drop policy if exists "items delete own"   on public.items;

create policy "items read all"   on public.items for select using (true);
create policy "items insert own" on public.items for insert to authenticated
  with check (
    auth.uid() = user_id
    and college_id = (select p.college_id from public.profiles p where p.id = auth.uid())
  );
create policy "items update own" on public.items for update to authenticated using (auth.uid() = user_id);
create policy "items delete own" on public.items for delete to authenticated using (auth.uid() = user_id);

-- 4. Photo storage (public bucket; each student writes only inside their own folder)
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

drop policy if exists "photos read"        on storage.objects;
drop policy if exists "photos upload own"  on storage.objects;
drop policy if exists "photos delete own"  on storage.objects;

create policy "photos read" on storage.objects for select using (bucket_id = 'item-photos');
create policy "photos upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);
