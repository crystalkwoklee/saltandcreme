-- ─────────────────────────────────────────────────────────────────────────────
-- Salt & Crème — Supabase setup
-- Run this once in: Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. profiles table (one row per user, created automatically on sign-up)
create table if not exists public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  display_name text    not null default '',
  email        text,
  stamps       jsonb   not null default '[]'::jsonb,
  updated_at   timestamp with time zone default now()
);

-- 2. Row Level Security — users can only touch their own row
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Admin (Crystal) can read and update any profile
--    This lets the admin dashboard list all customers and manage stamps.
create policy "Admin reads all profiles"
  on public.profiles for select
  using (auth.jwt() ->> 'email' = 'crystal.k.lee2@gmail.com');

create policy "Admin updates all profiles"
  on public.profiles for update
  using (auth.jwt() ->> 'email' = 'crystal.k.lee2@gmail.com');

-- 4. Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
