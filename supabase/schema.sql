-- Supabase Database Schema for Kindr
-- Place this in the Supabase SQL Editor and run it to set up your tables, triggers, and RLS policies.

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------
-- 1. PROFILES TABLE
-- Extends Supabase's built-in auth.users
-- -------------------------------------------------------------
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    name text not null,
    color text not null default '#3B82F6', -- Hex color for the friend-dot (default blue)
    updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Permissive RLS Policies for Profiles
create policy "Allow public read access to profiles"
    on public.profiles for select
    using (true);

create policy "Allow users to update their own profile"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "Allow all insert access for demo/testing"
    on public.profiles for insert
    with check (true);

-- -------------------------------------------------------------
-- AUTOMATIC PROFILE CREATION TRIGGER
-- When a user signs up via Supabase Auth, a profile is created
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
declare
    default_name text;
    default_color text;
    colors text[] := array['#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
begin
    -- Extract name from metadata if available, otherwise use email or anonymous label
    default_name := coalesce(
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'full_name',
        split_part(new.email, '@', 1),
        'Friend ' || substring(new.id::text from 1 for 4)
    );
    
    -- Pick a random vibrant color for their friend-dot
    default_color := colors[floor(random() * 6 + 1)];

    insert into public.profiles (id, name, color)
    values (new.id, default_name, default_color);
    
    return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();


-- -------------------------------------------------------------
-- 2. EVENTS TABLE
-- -------------------------------------------------------------
create table public.events (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    organizer_id uuid references public.profiles(id) on delete cascade not null,
    location text,
    description text,
    time timestamptz not null,
    volunteers_needed integer default 0,
    supplies text[] default '{}'::text[], -- Text array for supplies list
    jobs jsonb default '[]'::jsonb, -- JSONB array of jobs: [{ "label": "Driver", "needed": 2, "filled": 1 }]
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.events enable row level security;

-- Permissive RLS Policies for Events
create policy "Allow public read access to events"
    on public.events for select
    using (true);

create policy "Allow authenticated users to create events"
    on public.events for insert
    with check (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy "Allow organizers to update their events"
    on public.events for update
    using (auth.uid() = organizer_id or auth.uid() is not null); -- Allow broad updates for demo simplicity

create policy "Allow organizers to delete their events"
    on public.events for delete
    using (auth.uid() = organizer_id or auth.uid() is not null);


-- -------------------------------------------------------------
-- 3. EVENT PARTICIPANTS TABLE
-- Join table representing volunteers and followers
-- -------------------------------------------------------------
create table public.event_participants (
    id uuid primary key default gen_random_uuid(),
    event_id uuid references public.events(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    role text not null check (role in ('volunteer', 'follower')), -- Strict volunteer or follower role
    created_at timestamptz default now(),
    
    -- Ensure a user can only have one participant role per event
    constraint unique_event_user unique (event_id, user_id)
);

-- Enable RLS
alter table public.event_participants enable row level security;

-- Permissive RLS Policies for Event Participants
create policy "Allow public read access to event participants"
    on public.event_participants for select
    using (true);

create policy "Allow all read/write for demo participants"
    on public.event_participants for insert
    with check (true);

create policy "Allow updates to participant role"
    on public.event_participants for update
    using (true);

create policy "Allow deletion of participant role"
    on public.event_participants for delete
    using (true);


-- -------------------------------------------------------------
-- 4. EVENT UPDATES TABLE
-- -------------------------------------------------------------
create table public.event_updates (
    id uuid primary key default gen_random_uuid(),
    event_id uuid references public.events(id) on delete cascade not null,
    text text not null,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.event_updates enable row level security;

-- Permissive RLS Policies for Event Updates
create policy "Allow public read access to event updates"
    on public.event_updates for select
    using (true);

create policy "Allow organizer/public to create updates"
    on public.event_updates for insert
    with check (true);


-- -------------------------------------------------------------
-- 5. FRIENDSHIPS TABLE
-- Social graph for Kindr
-- -------------------------------------------------------------
create table public.friendships (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    friend_id uuid references public.profiles(id) on delete cascade not null,
    status text not null default 'accepted' check (status in ('pending', 'accepted')),
    created_at timestamptz default now(),
    
    -- Prevent duplicate friendship records
    constraint unique_user_friend unique (user_id, friend_id),
    -- Prevent friending yourself
    constraint user_cannot_be_friend_with_self check (user_id <> friend_id)
);

-- Enable RLS
alter table public.friendships enable row level security;

-- Permissive RLS Policies for Friendships
create policy "Allow public read access to friendships"
    on public.friendships for select
    using (true);

create policy "Allow all friendship creations for demo"
    on public.friendships for insert
    with check (true);

create policy "Allow updating friendship status"
    on public.friendships for update
    using (true);

create policy "Allow deleting friendships"
    on public.friendships for delete
    using (true);


-- -------------------------------------------------------------
-- 6. EVENT INVITES TABLE
-- Allows volunteers to invite their friends to events
-- -------------------------------------------------------------
create table public.event_invites (
    id uuid primary key default gen_random_uuid(),
    event_id uuid references public.events(id) on delete cascade not null,
    inviter_id uuid references public.profiles(id) on delete cascade not null,
    invitee_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamptz default now(),
    
    -- Prevent duplicate invites for the same event
    constraint unique_event_invite unique (event_id, inviter_id, invitee_id)
);

-- Enable RLS
alter table public.event_invites enable row level security;

-- Permissive RLS Policies for Event Invites
create policy "Allow read access to event invites"
    on public.event_invites for select
    using (true);

create policy "Allow all insert for demo"
    on public.event_invites for insert
    with check (true);

create policy "Allow all delete for demo"
    on public.event_invites for delete
    using (true);
