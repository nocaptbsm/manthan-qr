-- ============================================================================
-- ManthanQR — Seed Data for Development
-- ============================================================================
-- Note: Run this AFTER creating users via Supabase Auth.
-- The auth trigger will create profiles automatically.
-- This seed file updates roles and adds sample data.
-- ============================================================================

-- Update roles for seeded users (after auth signup)
-- These UUIDs would be replaced with actual auth.users IDs
-- For development, we insert directly:

-- Sample devices
INSERT INTO public.devices (id, device_name, device_code, device_secret, location_name, description, is_active) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'Main Lecture Hall', 'DEV-MLH-001', crypt('secret_mlh_001', gen_salt('bf')), 'Building A - Room 101', 'Primary lecture hall with 200 seats', true),
    ('d1000000-0000-0000-0000-000000000002', 'Computer Lab', 'DEV-CL-002', crypt('secret_cl_002', gen_salt('bf')), 'Building B - Room 205', 'Computer laboratory with 50 workstations', true),
    ('d1000000-0000-0000-0000-000000000003', 'Library Reading Room', 'DEV-LIB-003', crypt('secret_lib_003', gen_salt('bf')), 'Central Library - Floor 2', 'Silent reading and study area', true);

-- ============================================================================
-- Note: To fully seed the database:
-- 1. Create users via Supabase Auth API or Dashboard
-- 2. The on_auth_user_created trigger will create profiles
-- 3. Update roles using:
--    UPDATE public.users SET role = 'super_admin' WHERE email = 'admin@manthanqr.com';
--    UPDATE public.users SET role = 'admin' WHERE email = 'teacher1@manthanqr.com';
-- 4. Create sample sessions:
--
-- INSERT INTO public.attendance_sessions (title, description, start_time, end_time, device_id, created_by, status)
-- VALUES (
--     'Data Structures Lecture',
--     'Week 5 - Binary Trees',
--     NOW(),
--     NOW() + INTERVAL '1 hour',
--     'd1000000-0000-0000-0000-000000000001',
--     '<admin-user-id>',
--     'active'
-- );
-- ============================================================================
