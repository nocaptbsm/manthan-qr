-- ============================================================================
-- ManthanQR — Database Indexes
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_roll_number ON public.users(roll_number) WHERE roll_number IS NOT NULL;
CREATE INDEX idx_users_is_active ON public.users(is_active);

-- Devices indexes
CREATE INDEX idx_devices_device_code ON public.devices(device_code);
CREATE INDEX idx_devices_is_active ON public.devices(is_active);
CREATE INDEX idx_devices_created_by ON public.devices(created_by);
CREATE INDEX idx_devices_location ON public.devices(location_name);

-- Attendance Sessions indexes
CREATE INDEX idx_sessions_device_id ON public.attendance_sessions(device_id);
CREATE INDEX idx_sessions_created_by ON public.attendance_sessions(created_by);
CREATE INDEX idx_sessions_status ON public.attendance_sessions(status);
CREATE INDEX idx_sessions_start_time ON public.attendance_sessions(start_time);
CREATE INDEX idx_sessions_end_time ON public.attendance_sessions(end_time);
CREATE INDEX idx_sessions_active ON public.attendance_sessions(device_id, status)
    WHERE status = 'active';

-- Dynamic Tokens indexes (critical for performance)
CREATE INDEX idx_tokens_token ON public.dynamic_tokens(token);
CREATE INDEX idx_tokens_device_id ON public.dynamic_tokens(device_id);
CREATE INDEX idx_tokens_session_id ON public.dynamic_tokens(session_id);
CREATE INDEX idx_tokens_expires_at ON public.dynamic_tokens(expires_at);
CREATE INDEX idx_tokens_active ON public.dynamic_tokens(token, expires_at, is_used)
    WHERE is_used = false;

-- Attendance Records indexes
CREATE INDEX idx_records_student_id ON public.attendance_records(student_id);
CREATE INDEX idx_records_session_id ON public.attendance_records(session_id);
CREATE INDEX idx_records_device_id ON public.attendance_records(device_id);
CREATE INDEX idx_records_marked_at ON public.attendance_records(marked_at);
CREATE INDEX idx_records_student_session ON public.attendance_records(student_id, session_id);
CREATE INDEX idx_records_status ON public.attendance_records(status);

-- Audit Logs indexes
CREATE INDEX idx_audit_action ON public.audit_logs(action);
CREATE INDEX idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_performed_by ON public.audit_logs(performed_by);
CREATE INDEX idx_audit_created_at ON public.audit_logs(created_at DESC);
