-- ============================================================================
-- ManthanQR — Smart Attendance Management System
-- Database Schema for Supabase PostgreSQL
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'student');
CREATE TYPE session_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
CREATE TYPE attendance_status AS ENUM ('present', 'late', 'excused');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'student',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    roll_number VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Devices table
CREATE TABLE public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_name VARCHAR(255) NOT NULL,
    device_code VARCHAR(50) NOT NULL UNIQUE,
    device_secret TEXT NOT NULL, -- hashed secret for device authentication
    location_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_heartbeat TIMESTAMPTZ,
    firmware_version VARCHAR(50),
    ip_address VARCHAR(45),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attendance Sessions table
CREATE TABLE public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status session_status NOT NULL DEFAULT 'scheduled',
    late_threshold_minutes INTEGER DEFAULT 10, -- minutes after start to mark as 'late'
    max_attendees INTEGER, -- optional cap
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_session_time CHECK (end_time > start_time)
);

-- Dynamic Tokens table
CREATE TABLE public.dynamic_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(128) NOT NULL UNIQUE,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    used_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attendance Records table
CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    token_id UUID REFERENCES public.dynamic_tokens(id) ON DELETE SET NULL,
    marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status attendance_status NOT NULL DEFAULT 'present',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_session UNIQUE (student_id, session_id)
);

-- Audit Logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    details JSONB DEFAULT '{}',
    performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON public.devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON public.attendance_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.users WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if current user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if current user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = (SELECT auth.uid())
        AND role = 'super_admin'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
