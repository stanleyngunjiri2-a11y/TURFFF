-- TURFF initial database schema
-- Review and run in the SQL Editor of the intended Supabase project.

create extension if not exists pgcrypto;

create type public.account_role as enum (
  'footballer',
  'turf_owner',
  'superadmin'
);

create type public.turf_review_status as enum (
  'pending',
  'approved',
  'rejected'
);

create type public.booking_status as enum (
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'completed'
);

create type public.payment_status as enum (
  'unpaid',
  'pending_verification',
  'verified',
  'rejected'
);

create type public.subscription_status as enum (
  'pending',
  'active',
  'expired',
  'cancelled'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role public.account_role not null default 'footballer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.turfs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  description text not null default '',
  county text not null,
  town text not null,
  address text not null default '',
  latitude double precision,
  longitude double precision,
  price_per_hour numeric(10,2) not null check (price_per_hour >= 0),
  capacity integer check (capacity is null or capacity > 0),
  facilities text[] not null default '{}',
  opening_time time,
  closing_time time,
  review_status public.turf_review_status not null default 'pending',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create index turfs_location_idx
  on public.turfs (county, town);

create index turfs_discovery_idx
  on public.turfs (review_status, is_active);

create table public.turf_images (
  id uuid primary key default gen_random_uuid(),
  turf_id uuid not null references public.turfs(id) on delete cascade,
  image_url text not null,
  alt_text text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  plan_name text not null,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'KES',
  status public.subscription_status not null default 'pending',
  starts_at timestamptz,
  ends_at timestamptz,
  payment_reference text,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index subscriptions_owner_status_idx
  on public.subscriptions (owner_id, status, ends_at);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  turf_id uuid not null references public.turfs(id) on delete restrict,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  player_count integer check (player_count is null or player_count > 0),
  customer_note text not null default '',
  status public.booking_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  payment_reference text,
  payment_note text,
  owner_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index bookings_turf_date_idx
  on public.bookings (turf_id, booking_date, start_time);

create index bookings_customer_idx
  on public.bookings (customer_id, created_at desc);

-- Create a basic profile whenever a new authenticated account is created.
-- Public sign-up always starts as a footballer. Privileged roles must be
-- assigned through a trusted administrative process.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'footballer'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Prevent users from changing their own role or account identity fields.
create function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id or new.role <> old.role then
    raise exception 'Profile identity and role changes require privileged administration';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_guard_update
before update on public.profiles
for each row execute function public.guard_profile_update();

-- Helpers for RLS policies.
create function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'superadmin'
  );
$$;

create function public.has_active_subscription(p_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.owner_id = p_owner_id
      and s.status = 'active'
      and (s.starts_at is null or s.starts_at <= now())
      and (s.ends_at is null or s.ends_at > now())
  );
$$;

alter table public.profiles enable row level security;
alter table public.turfs enable row level security;
alter table public.turf_images enable row level security;
alter table public.subscriptions enable row level security;
alter table public.bookings enable row level security;

create policy "Users can view their own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()) or (select public.is_superadmin()));

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Public can discover approved turfs"
on public.turfs for select
to anon, authenticated
using (
  review_status = 'approved'
  and is_active = true
  or owner_id = (select auth.uid())
  or (select public.is_superadmin())
);

create policy "Owners can submit turf listings"
on public.turfs for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'turf_owner'
  )
  and review_status = 'pending'
);

create policy "Owners and admins can update turfs"
on public.turfs for update
to authenticated
using (
  owner_id = (select auth.uid())
  or (select public.is_superadmin())
)
with check (
  (owner_id = (select auth.uid()) and review_status <> 'approved')
  or (select public.is_superadmin())
);

create policy "Owners can add images to their turfs"
on public.turf_images for insert
to authenticated
with check (
  exists (
    select 1 from public.turfs t
    where t.id = turf_id
      and t.owner_id = (select auth.uid())
  )
  or (select public.is_superadmin())
);

create policy "Images follow turf visibility"
on public.turf_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.turfs t
    where t.id = turf_id
      and (
        (t.review_status = 'approved' and t.is_active = true)
        or t.owner_id = (select auth.uid())
        or (select public.is_superadmin())
      )
  )
);

create policy "Owners and admins can manage subscriptions"
on public.subscriptions for select
to authenticated
using (
  owner_id = (select auth.uid())
  or (select public.is_superadmin())
);

create policy "Owners can view bookings for their turfs"
on public.bookings for select
to authenticated
using (
  customer_id = (select auth.uid())
  or exists (
    select 1 from public.turfs t
    where t.id = turf_id
      and t.owner_id = (select auth.uid())
  )
  or (select public.is_superadmin())
);

create policy "Subscribed owners can receive booking requests"
on public.bookings for insert
to authenticated
with check (
  customer_id = (select auth.uid())
  and status = 'pending'
  and payment_status = 'unpaid'
  and exists (
    select 1
    from public.turfs t
    where t.id = turf_id
      and t.review_status = 'approved'
      and t.is_active = true
      and public.has_active_subscription(t.owner_id)
  )
);

-- Booking updates are intentionally disabled for ordinary users.
-- Trusted server-side operations will handle status and payment transitions.
create policy "Superadmins can update bookings"
on public.bookings for update
to authenticated
using ((select public.is_superadmin()))
with check ((select public.is_superadmin()));

-- No public inserts or updates are permitted for subscriptions.
-- A trusted server-side administrative process must manage subscription
-- activation, verification and role assignment.
