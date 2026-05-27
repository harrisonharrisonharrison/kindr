-- Supabase Seed Data for Kindr Mock Data
-- Run this in the Supabase SQL Editor AFTER running schema.sql.

-- -------------------------------------------------------------
-- 0. CLEAN EXISTING SEED DATA (If any)
-- -------------------------------------------------------------
truncate public.friendships cascade;
truncate public.event_participants cascade;
truncate public.event_updates cascade;
truncate public.events cascade;
delete from public.profiles;
delete from auth.users;

-- -------------------------------------------------------------
-- 1. SEED AUTH USERS
-- Inserts dummy users into Supabase Auth with fixed deterministic UUIDs.
-- -------------------------------------------------------------
insert into auth.users (id, email, email_confirmed_at, role, aud, raw_user_meta_data)
values 
  (
    '00000000-0000-0000-0000-000000000000', 
    'you@kindr.com', 
    now(), 
    'authenticated', 
    'authenticated', 
    '{"name": "You"}'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111111', 
    'law@kindr.com', 
    now(), 
    'authenticated', 
    'authenticated', 
    '{"name": "Law"}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222', 
    'shyel@kindr.com', 
    now(), 
    'authenticated', 
    'authenticated', 
    '{"name": "Shyel"}'::jsonb
  ),
  (
    '33333333-3333-3333-3333-333333333333', 
    'pradosh@kindr.com', 
    now(), 
    'authenticated', 
    'authenticated', 
    '{"name": "Pradosh"}'::jsonb
  ),
  (
    '44444444-4444-4444-4444-444444444444', 
    'foodbank@kindr.com', 
    now(), 
    'authenticated', 
    'authenticated', 
    '{"name": "Community Food Bank"}'::jsonb
  ),
  (
    '55555555-5555-5555-5555-555555555555', 
    'venushacks@kindr.com', 
    now(), 
    'authenticated', 
    'authenticated', 
    '{"name": "VenusHacks Team"}'::jsonb
  ),
  (
    '66666666-6666-6666-6666-666666666666', 
    'mutualaid@kindr.com', 
    now(), 
    'authenticated', 
    'authenticated', 
    '{"name": "Garden Grove Mutual Aid"}'::jsonb
  )
on conflict (id) do nothing;

-- -------------------------------------------------------------
-- 2. UPDATE PROFILE COLORS & NAMES
-- The auth trigger automatically created the profile rows, but we ensure their colors are perfectly set.
-- -------------------------------------------------------------
update public.profiles set color = '#FFFFFF', name = 'You' where id = '00000000-0000-0000-0000-000000000000';
update public.profiles set color = '#8B3A3A', name = 'Law' where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set color = '#1E3D2F', name = 'Shyel' where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set color = '#2E7D96', name = 'Pradosh' where id = '33333333-3333-3333-3333-333333333333';
update public.profiles set color = '#3B82F6', name = 'Community Food Bank' where id = '44444444-4444-4444-4444-444444444444';
update public.profiles set color = '#3B82F6', name = 'VenusHacks Team' where id = '55555555-5555-5555-5555-555555555555';
update public.profiles set color = '#3B82F6', name = 'Garden Grove Mutual Aid' where id = '66666666-6666-6666-6666-666666666666';

-- -------------------------------------------------------------
-- 3. SEED EVENTS
-- -------------------------------------------------------------
insert into public.events (id, name, organizer_id, location, description, time, volunteers_needed, supplies, jobs)
values
  (
    'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
    'Food Pantry',
    '44444444-4444-4444-4444-444444444444', -- Community Food Bank
    '123 Main St, Garden Grove, CA',
    'Help sort and distribute food to local families in need. We need volunteers for lifting boxes and organizing shelves.',
    '2026-05-30T09:00:00Z',
    10,
    array['Gloves', 'Hand Sanitizer'],
    '[
      {"label": "Box Lifters", "needed": 4, "filled": 2},
      {"label": "Distribution", "needed": 6, "filled": 4}
    ]'::jsonb
  ),
  (
    'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2',
    'VenusHacks',
    '55555555-5555-5555-5555-555555555555', -- VenusHacks Team
    'UCI Student Center',
    'Women-centric hackathon. Volunteers needed to help with registration, mentoring, and food distribution.',
    '2026-05-29T17:00:00Z',
    20,
    array['Lanyards', 'T-shirts'],
    '[
      {"label": "Registration Desk", "needed": 5, "filled": 5},
      {"label": "Food Distribution", "needed": 15, "filled": 8}
    ]'::jsonb
  ),
  (
    'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3',
    'Garden Grove Evacuation',
    '66666666-6666-6666-6666-666666666666', -- Garden Grove Mutual Aid
    'Garden Grove High School',
    'Emergency evacuation support. Residents need help transporting belongings and people to the community center. Trucks and vans highly needed.',
    '2026-05-26T12:00:00Z',
    50,
    array['Moving Boxes', 'Tape', 'Water', 'Snacks'],
    '[
      {"label": "Drivers with Trucks/Vans", "needed": 20, "filled": 5},
      {"label": "Heavy Lifting", "needed": 30, "filled": 12}
    ]'::jsonb
  )
on conflict (id) do nothing;

-- -------------------------------------------------------------
-- 4. SEED EVENT PARTICIPANTS (Volunteering and Following)
-- -------------------------------------------------------------
insert into public.event_participants (event_id, user_id, role)
values
  -- Event 1
  ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', '00000000-0000-0000-0000-000000000000', 'volunteer'), -- You
  ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', '22222222-2222-2222-2222-222222222222', 'volunteer'), -- Shyel

  -- Event 2
  ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', '33333333-3333-3333-3333-333333333333', 'volunteer'), -- Pradosh
  ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', '00000000-0000-0000-0000-000000000000', 'follower')     -- You
on conflict do nothing;

-- -------------------------------------------------------------
-- 5. SEED EVENT UPDATES
-- -------------------------------------------------------------
insert into public.event_updates (event_id, text, created_at)
values
  ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'Truck with fresh produce arrived early!', now() - interval '3 hours'),
  ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'Registration layout finalized.', now() - interval '2 hours'),
  ('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', 'We have 5 trucks en route but need more lifting volunteers at sector B.', now() - interval '1 hour'),
  ('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', 'Evacuation center setup complete.', now() - interval '30 minutes');

-- -------------------------------------------------------------
-- 6. SEED FRIENDSHIPS (Bidirectional)
-- -------------------------------------------------------------
insert into public.friendships (user_id, friend_id, status)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'accepted'), -- You -> Law
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'accepted'), -- Law -> You
  
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'accepted'), -- You -> Shyel
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'accepted'), -- Shyel -> You
  
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'accepted'), -- You -> Pradosh
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'accepted')  -- Pradosh -> You
on conflict do nothing;


-- -------------------------------------------------------------
-- 7. OAUTH INTEGRATION WORKAROUND UTILITY
-- Run: `select public.merge_oauth_user_with_seed('YOUR-ACTUAL-OAUTH-UUID');`
-- in Supabase SQL editor once you log in via Google OAuth for the first time.
-- This automatically migrates your seeded friendships and event tracking over to your real account.
-- -------------------------------------------------------------
create or replace function public.merge_oauth_user_with_seed(real_user_id uuid)
returns void as $$
begin
  -- Update friendships referencing dummy user
  update public.friendships set user_id = real_user_id where user_id = '00000000-0000-0000-0000-000000000000';
  update public.friendships set friend_id = real_user_id where friend_id = '00000000-0000-0000-0000-000000000000';

  -- Update event participants
  update public.event_participants set user_id = real_user_id where user_id = '00000000-0000-0000-0000-000000000000';

  -- Adopt the seed profile name and color to your new OAuth profile
  update public.profiles set name = 'You', color = '#FFFFFF' where id = real_user_id;

  -- Clean up the temporary seed user from public.profiles and auth.users
  delete from public.profiles where id = '00000000-0000-0000-0000-000000000000';
  delete from auth.users where id = '00000000-0000-0000-0000-000000000000';
end;
$$ language plpgsql security definer;
