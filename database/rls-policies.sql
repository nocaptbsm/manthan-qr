-- ============================================================================
-- ManthanQR — Row Level Security Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "users_select_own"
    ON public.users FOR SELECT
    USING (id = (SELECT auth.uid()));

-- Admins and super_admins can read all users
CREATE POLICY "users_select_admin"
    ON public.users FOR SELECT
    USING ((SELECT public.is_admin_or_above()));

-- Users can update their own profile (non-role fields)
CREATE POLICY "users_update_own"
    ON public.users FOR UPDATE
    USING (id = (SELECT auth.uid()))
    WITH CHECK (id = (SELECT auth.uid()) AND role = (SELECT role FROM public.users WHERE id = (SELECT auth.uid())));

-- Super admins can update any user
CREATE POLICY "users_update_super_admin"
    ON public.users FOR UPDATE
    USING ((SELECT public.is_super_admin()));

-- Super admins can insert users
CREATE POLICY "users_insert_super_admin"
    ON public.users FOR INSERT
    WITH CHECK ((SELECT public.is_super_admin()));

-- Super admins can delete users
CREATE POLICY "users_delete_super_admin"
    ON public.users FOR DELETE
    USING ((SELECT public.is_super_admin()));

-- ============================================================================
-- DEVICES POLICIES
-- ============================================================================

-- Admins and super_admins can read all devices
CREATE POLICY "devices_select_admin"
    ON public.devices FOR SELECT
    USING ((SELECT public.is_admin_or_above()));

-- Super admins can create devices
CREATE POLICY "devices_insert_super_admin"
    ON public.devices FOR INSERT
    WITH CHECK ((SELECT public.is_super_admin()));

-- Super admins can update devices
CREATE POLICY "devices_update_super_admin"
    ON public.devices FOR UPDATE
    USING ((SELECT public.is_super_admin()));

-- Super admins can delete devices
CREATE POLICY "devices_delete_super_admin"
    ON public.devices FOR DELETE
    USING ((SELECT public.is_super_admin()));

-- ============================================================================
-- ATTENDANCE SESSIONS POLICIES
-- ============================================================================

-- Admins can read all sessions
CREATE POLICY "sessions_select_admin"
    ON public.attendance_sessions FOR SELECT
    USING ((SELECT public.is_admin_or_above()));

-- Students can read active sessions
CREATE POLICY "sessions_select_student"
    ON public.attendance_sessions FOR SELECT
    USING (
        (SELECT public.get_user_role()) = 'student'
        AND status IN ('active', 'completed')
    );

-- Admins can create sessions
CREATE POLICY "sessions_insert_admin"
    ON public.attendance_sessions FOR INSERT
    WITH CHECK ((SELECT public.is_admin_or_above()));

-- Admins can update sessions they created, super admins can update any
CREATE POLICY "sessions_update_admin"
    ON public.attendance_sessions FOR UPDATE
    USING (
        created_by = (SELECT auth.uid())
        OR (SELECT public.is_super_admin())
    );

-- Admins can delete sessions they created, super admins can delete any
CREATE POLICY "sessions_delete_admin"
    ON public.attendance_sessions FOR DELETE
    USING (
        created_by = (SELECT auth.uid())
        OR (SELECT public.is_super_admin())
    );

-- ============================================================================
-- DYNAMIC TOKENS POLICIES
-- Note: Tokens are primarily managed by the backend service role.
-- These policies restrict direct client access.
-- ============================================================================

-- No direct client read access (backend uses service_role)
CREATE POLICY "tokens_no_client_select"
    ON public.dynamic_tokens FOR SELECT
    USING (false);

-- No direct client insert
CREATE POLICY "tokens_no_client_insert"
    ON public.dynamic_tokens FOR INSERT
    WITH CHECK (false);

-- No direct client update
CREATE POLICY "tokens_no_client_update"
    ON public.dynamic_tokens FOR UPDATE
    USING (false);

-- No direct client delete
CREATE POLICY "tokens_no_client_delete"
    ON public.dynamic_tokens FOR DELETE
    USING (false);

-- ============================================================================
-- ATTENDANCE RECORDS POLICIES
-- ============================================================================

-- Students can read their own attendance records
CREATE POLICY "records_select_own"
    ON public.attendance_records FOR SELECT
    USING (student_id = (SELECT auth.uid()));

-- Admins can read all attendance records
CREATE POLICY "records_select_admin"
    ON public.attendance_records FOR SELECT
    USING ((SELECT public.is_admin_or_above()));

-- No direct client insert (handled by backend service role)
CREATE POLICY "records_no_client_insert"
    ON public.attendance_records FOR INSERT
    WITH CHECK (false);

-- No direct update or delete on attendance records
CREATE POLICY "records_no_update"
    ON public.attendance_records FOR UPDATE
    USING (false);

CREATE POLICY "records_no_delete"
    ON public.attendance_records FOR DELETE
    USING (false);

-- ============================================================================
-- AUDIT LOGS POLICIES
-- ============================================================================

-- Super admins can read audit logs
CREATE POLICY "audit_select_super_admin"
    ON public.audit_logs FOR SELECT
    USING ((SELECT public.is_super_admin()));

-- No direct client insert (handled by backend service role)
CREATE POLICY "audit_no_client_insert"
    ON public.audit_logs FOR INSERT
    WITH CHECK (false);

-- No update or delete on audit logs (immutable)
CREATE POLICY "audit_no_update"
    ON public.audit_logs FOR UPDATE
    USING (false);

CREATE POLICY "audit_no_delete"
    ON public.audit_logs FOR DELETE
    USING (false);
